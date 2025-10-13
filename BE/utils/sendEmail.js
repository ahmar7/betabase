const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');
const { Resend } = require('resend');
const emailjs = require('@emailjs/nodejs');

module.exports = async (email, subject, text) => {
  try {
    // ✅ INPUT VALIDATION - Catch errors before they happen
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error(`Invalid email address: ${email}`);
    }
    
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      throw new Error('Email subject is required and cannot be empty');
    }
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Email text/body is required and cannot be empty');
    }

    console.log(`📧 Attempting to send email to: ${email}`);
    console.log(`📧 Subject: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}`);

    // 📊 CHECK AVAILABLE EMAIL SERVICES
    const availableServices = {
      resend: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()),
      emailjs: !!(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY),
      sendgrid: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()),
      smtp: !!(process.env.HOST && process.env.USER && process.env.PASS && process.env.EMAIL_PORT)
    };

    console.log('📊 Available email services:', {
      resend: availableServices.resend ? '✅ Configured' : '❌ Missing RESEND_API_KEY',
      emailjs: availableServices.emailjs ? '✅ Configured' : '❌ Missing EMAILJS config',
      sendgrid: availableServices.sendgrid ? '✅ Configured' : '❌ Missing SENDGRID_API_KEY',
      smtp: availableServices.smtp ? '✅ Configured' : '❌ Missing SMTP config'
    });

    const totalServices = Object.values(availableServices).filter(Boolean).length;
    console.log(`🎯 Will try ${totalServices} available service(s) in order: ${Object.entries(availableServices).filter(([,available]) => available).map(([name]) => name).join(' → ')}`);

    let attemptedServices = [];
    let lastError = null;

    // ✅ OPTION 1: Try Resend API First (BEST - No phone verification!)
    if (availableServices.resend) {
      console.log('\n🚀 [1/4] Trying Resend API (recommended)');
      attemptedServices.push('resend');
      
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM || `BetaBase <onboarding@resend.dev>`,
          to: email,
          subject: subject,
          text: text,
          html: text.replace(/\n/g, '<br>')
        });

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        console.log(`✅ SUCCESS! Email sent via Resend to: ${email}`);
        console.log(`📬 Message ID: ${data.id}`);
        return {
          success: true,
          messageId: data.id,
          provider: 'resend',
          method: 'api',
          attemptedServices
        };
      } catch (resendError) {
        lastError = resendError;
        console.error(`❌ Resend failed: ${resendError.message}`);
        console.log('⚠️ Continuing to next service...');
      }
    } else {
      console.log('\n⏭️ [1/4] Skipping Resend API - not configured');
    }

    // ✅ OPTION 2: Try EmailJS API (Easy setup, 200 emails/month free)
    if (availableServices.emailjs) {
      console.log('\n📧 [2/4] Trying EmailJS API');
      attemptedServices.push('emailjs');
      
      try {
        const templateParams = {
          to_email: email,
          to_name: email.split('@')[0],
          subject: subject,
          message: text,
          from_name: 'BetaBase',
          reply_to: process.env.EMAILJS_REPLY_TO || 'admin@betabase.pro'
        };

        const response = await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          templateParams,
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY,
          }
        );

        console.log(`✅ SUCCESS! Email sent via EmailJS to: ${email}`);
        console.log(`📬 Response: ${response.status} ${response.text}`);
        return {
          success: true,
          messageId: response.text,
          provider: 'emailjs',
          method: 'api',
          attemptedServices
        };
      } catch (emailjsError) {
        lastError = emailjsError;
        console.error(`❌ EmailJS failed: ${emailjsError.message}`);
        console.log('⚠️ Continuing to next service...');
      }
    } else {
      console.log('\n⏭️ [2/4] Skipping EmailJS - not configured (missing SERVICE_ID, TEMPLATE_ID, or PUBLIC_KEY)');
    }

    // ✅ OPTION 3: Try SendGrid API (Requires phone verification)
    if (availableServices.sendgrid) {
      console.log('\n🔷 [3/4] Trying SendGrid API');
      attemptedServices.push('sendgrid');
      
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM || process.env.USER || 'noreply@betabase.pro',
            name: process.env.SENDGRID_FROM_NAME || 'BetaBase'
          },
          subject: subject,
          text: text,
          html: text.replace(/\n/g, '<br>'),
          trackingSettings: {
            clickTracking: { enable: false },
            openTracking: { enable: false }
          }
        };

        await sgMail.send(msg);
        
        console.log(`✅ SUCCESS! Email sent via SendGrid to: ${email}`);
        return {
          success: true,
          provider: 'sendgrid',
          method: 'api',
          attemptedServices
        };
      } catch (sgError) {
        lastError = sgError;
        const errorMsg = sgError.response?.body?.errors?.[0]?.message || sgError.message;
        console.error(`❌ SendGrid failed: ${errorMsg}`);
        console.log('⚠️ Continuing to next service...');
      }
    } else {
      console.log('\n⏭️ [3/4] Skipping SendGrid - not configured (missing SENDGRID_API_KEY)');
    }

    // ✅ OPTION 4: SMTP Fallback (Works locally, may fail on cloud platforms)
    if (availableServices.smtp) {
      console.log('\n📨 [4/4] Trying SMTP (may not work on Render/Heroku - ports often blocked)');
      attemptedServices.push('smtp');
      
      try {
        const isSecure = process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465;
        
        const transporter = nodemailer.createTransport({
          host: process.env.HOST,
          port: Number(process.env.EMAIL_PORT),
          secure: isSecure,
          requireTLS: !isSecure,
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.3',
            ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
          },
          auth: {
            user: process.env.USER,
            pass: process.env.PASS,
          },
          connectionTimeout: 10000, // Reduced to 10s - fail fast on cloud
          greetingTimeout: 10000,
          socketTimeout: 10000,
          pool: true,
          maxConnections: 1,
          maxMessages: 3,
          rateDelta: 1000,
          rateLimit: 5
        });
        
        console.log(`📧 SMTP Config: ${process.env.HOST}:${process.env.EMAIL_PORT} (secure: ${isSecure})`);

        // Quick SMTP verification
        console.log('🔌 Verifying SMTP connection (10s timeout)...');
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        // Send via SMTP
        const mailOptions = {
          from: {
            name: 'BetaBase',
            address: process.env.USER
          },
          to: email,
          subject: subject,
          text: text,
          html: text.replace(/\n/g, '<br>'),
          headers: {
            'X-Mailer': 'BetaBase Email Service',
            'X-Priority': '1',
            'Importance': 'high'
          }
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ SUCCESS! Email sent via SMTP to: ${email}`);
        console.log(`📬 Message ID: ${info.messageId}`);

        return {
          success: true,
          messageId: info.messageId,
          provider: 'smtp',
          method: 'nodemailer',
          attemptedServices
        };

      } catch (smtpError) {
        lastError = smtpError;
        console.error(`❌ SMTP failed: ${smtpError.message}`);
        
        // Check if it's a connection timeout/blocked port
        if (smtpError.code === 'ETIMEDOUT' || smtpError.message.includes('timeout')) {
          console.log('🚨 SMTP timeout detected - likely blocked by cloud platform (Render/Heroku)');
        }
      }
    } else {
      console.log('\n⏭️ [4/4] Skipping SMTP - not configured (missing HOST, USER, PASS, or EMAIL_PORT)');
    }

    // 🚨 ALL SERVICES FAILED
    console.error('\n❌ ALL EMAIL SERVICES FAILED!');
    console.error(`📊 Services attempted: ${attemptedServices.join(' → ')}`);
    console.error(`📊 Services skipped: ${Object.entries(availableServices).filter(([name, available]) => !available && !attemptedServices.includes(name)).map(([name]) => name).join(', ') || 'none'}`);
    
    // Create comprehensive error message
    let errorMsg = `❌ FAILED to send email to ${email}\n\n`;
    errorMsg += `🔥 ATTEMPTED SERVICES: ${attemptedServices.length > 0 ? attemptedServices.join(' → ') : 'NONE'}\n`;
    
    if (attemptedServices.length === 0) {
      errorMsg += `\n🚨 NO EMAIL SERVICES CONFIGURED!\n`;
      errorMsg += `✅ QUICK SETUP:\n`;
      errorMsg += `   1. Add RESEND_API_KEY to your environment (easiest)\n`;
      errorMsg += `   2. Or configure SendGrid, EmailJS, or SMTP\n`;
      errorMsg += `   3. See documentation for setup guides\n`;
    } else {
      errorMsg += `\n📝 LAST ERROR: ${lastError?.message || 'Unknown error'}\n`;
      
      if (!availableServices.resend) {
        errorMsg += `\n✅ RECOMMENDED SOLUTION:\n`;
        errorMsg += `   Add RESEND_API_KEY to your environment:\n`;
        errorMsg += `   1. Sign up: https://resend.com/ (FREE)\n`;
        errorMsg += `   2. Get API key: Dashboard > API Keys\n`;
        errorMsg += `   3. Add to env: RESEND_API_KEY=re_xxxxx\n`;
        errorMsg += `   4. Restart server\n`;
      }
    }
    
    throw new Error(errorMsg);

  } catch (error) {
    console.error('❌ Email FAILED to send to:', email);
    console.error('📧 Email error details:', error);

    // ✅ STRUCTURED ERROR OBJECT
    const errorObj = {
      email,
      subject,
      text,
      errorType: 'unknown',
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
      retryable: true
    };

    // ✅ ERROR CLASSIFICATION
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
      errorObj.errorType = 'timeout';
      errorObj.errorCode = 'TIMEOUT';
      errorObj.errorMessage = 'SMTP connection timeout - server not responding';
      errorObj.retryable = true;
    } else if (errorMessage.includes('econnrefused')) {
      errorObj.errorType = 'connection_refused';
      errorObj.errorCode = 'REFUSED';
      errorObj.errorMessage = 'SMTP server refused connection';
      errorObj.retryable = true;
    } else if (errorMessage.includes('enotfound')) {
      errorObj.errorType = 'dns_error';
      errorObj.errorCode = 'DNS_ERROR';
      errorObj.errorMessage = 'SMTP server not found - DNS resolution failed';
      errorObj.retryable = false;
    } else if (errorMessage.includes('eauth') || error.responseCode === 535) {
      errorObj.errorType = 'authentication';
      errorObj.errorCode = 'AUTH_FAILED';
      errorObj.errorMessage = 'SMTP authentication failed - invalid credentials';
      errorObj.retryable = false;
    } else if (error.responseCode >= 500) {
      errorObj.errorType = 'server_error';
      errorObj.errorCode = 'SERVER_ERROR';
      errorObj.errorMessage = 'SMTP server error';
      errorObj.retryable = true;
    } else if (error.responseCode === 550) {
      errorObj.errorType = 'recipient_error';
      errorObj.errorCode = 'INVALID_RECIPIENT';
      errorObj.errorMessage = 'Recipient email rejected by server';
      errorObj.retryable = false;
    }

    // ✅ DETAILED ERROR LOGGING
    console.log('🚨 EMAIL FAILURE ANALYSIS:');
    console.log(`   📧 Recipient: ${email}`);
    console.log(`   🏷️  Subject: ${subject}`);
    console.log(`   ❌ Error Code: ${errorObj.errorCode}`);
    console.log(`   📝 Error Message: ${errorObj.errorMessage}`);
    console.log(`   🔄 Retryable: ${errorObj.retryable}`);
    console.log(`   📊 SMTP Response Code: ${error.responseCode || 'N/A'}`);
    console.log(`   🔧 System Error Code: ${error.code || 'N/A'}`);
    console.log(`   📍 Error Stack: ${error.stack}`);

    throw errorObj;
  }
};
