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

    // ✅ OPTION 1: Try Resend API First (EASIEST - No phone verification!)
    if (process.env.RESEND_API_KEY) {
      console.log('🚀 Using Resend API (easiest setup, no phone needed)');
      
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
          throw new Error(error.message);
        }

        console.log(`✅ Email sent successfully via Resend to: ${email}`);
        console.log(`📬 Message ID: ${data.id}`);
        return {
          success: true,
          messageId: data.id,
          provider: 'resend',
          method: 'api'
        };
      } catch (resendError) {
        console.error('❌ Resend error:', resendError.message);
        console.log('⚠️ Resend failed, trying EmailJS fallback...');
      }
    }

    // ✅ OPTION 2: Try EmailJS API (Easy setup, 200 emails/month free)
    if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
      console.log('📧 Using EmailJS API (easy setup, good for small projects)');
      
      try {
        const templateParams = {
          to_email: email,
          to_name: email.split('@')[0], // Extract name from email
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

        console.log(`✅ Email sent successfully via EmailJS to: ${email}`);
        console.log(`📬 Response Status: ${response.status} ${response.text}`);
        return {
          success: true,
          messageId: response.text,
          provider: 'emailjs',
          method: 'api'
        };
      } catch (emailjsError) {
        console.error('❌ EmailJS error:', emailjsError.message);
        console.log('⚠️ EmailJS failed, trying SendGrid fallback...');
      }
    }

    // ✅ OPTION 3: Try SendGrid API (Requires phone verification)
    if (process.env.SENDGRID_API_KEY) {
      console.log('🚀 Using SendGrid HTTP API (no SMTP ports needed)');
      
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: email,
          from: {
            email: process.env.SENDGRID_FROM || process.env.USER,
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
        
        console.log(`✅ Email sent successfully via SendGrid to: ${email}`);
        return {
          success: true,
          provider: 'sendgrid',
          method: 'api'
        };
      } catch (sgError) {
        console.error('❌ SendGrid error:', sgError.response?.body || sgError.message);
        
        // If SendGrid fails, try SMTP as fallback
        console.log('⚠️ SendGrid failed, trying SMTP fallback...');
      }
    }

    // ✅ OPTION 4: SMTP Fallback (Works locally, may fail on cloud platforms)
    
    // ENV VALIDATION - Ensure all required env vars exist
    const requiredEnvVars = ['HOST', 'USER', 'PASS', 'EMAIL_PORT'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Missing SMTP env vars: ${missingVars.join(', ')}`);
      throw new Error(`Cannot send email: Missing ${missingVars.join(', ')}. Please configure SENDGRID_API_KEY or SMTP settings.`);
    }

    console.log('📨 Using SMTP (may not work on cloud platforms like Render)');

    const isSecure = process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465;
    
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: isSecure,
      requireTLS: !isSecure,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
      connectionTimeout: 10000, // Reduced to 10s - fail fast
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
    try {
      console.log('🔌 Verifying SMTP connection (10s timeout)...');
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      
      // Provide helpful error message
      let errorMsg = '❌ SMTP CONNECTION BLOCKED OR FAILED\n\n';
      errorMsg += '🚨 This usually means:\n';
      errorMsg += '   1. Render.com is blocking SMTP ports (25, 465, 587)\n';
      errorMsg += '   2. Your hosting provider blocks outbound SMTP\n\n';
      errorMsg += '✅ SOLUTION: Use SendGrid (FREE):\n';
      errorMsg += '   1. Sign up: https://sendgrid.com/ (Free: 100 emails/day)\n';
      errorMsg += '   2. Get API key from Settings > API Keys\n';
      errorMsg += '   3. Add to Render env vars:\n';
      errorMsg += '      SENDGRID_API_KEY=SG.xxxxxxxxxxxxx\n';
      errorMsg += '      SENDGRID_FROM=admin@betabase.pro\n';
      errorMsg += '      SENDGRID_FROM_NAME=BetaBase\n';
      errorMsg += '   4. Restart server - emails will work!\n\n';
      errorMsg += `   Original error: ${verifyError.message}`;
      
      throw new Error(errorMsg);
    }

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
    
    console.log(`✅ Email sent successfully via SMTP to: ${email}`);
    console.log(`📬 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
      method: 'nodemailer'
    };

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
