const nodemailer = require("nodemailer");

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

    // ✅ ENV VALIDATION - Ensure all required env vars exist
    const requiredEnvVars = ['HOST', 'USER', 'PASS', 'EMAIL_PORT'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log(`📧 Attempting to send email to: ${email}`);
    console.log(`📧 Subject: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}`);

    // ✅ ENHANCED TRANSPORTER CONFIG with timeouts and security
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
      requireTLS: true, // Force TLS
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // Allow self-signed certificates
      },
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
      // ✅ TIMEOUT SETTINGS - Prevent hanging
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 30000,     // 30 seconds
      // ✅ CONNECTION POOL SETTINGS
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      rateDelta: 1000,          // 1 second between emails
      rateLimit: 5              // max 5 emails per rateDelta
    });

    // ✅ VERIFY CONNECTION before attempting to send
    try {
      console.log('🔌 Verifying SMTP connection...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      
      // Enhanced verification error handling
      let verifyErrorMsg = 'SMTP server connection failed';
      if (verifyError.code === 'ECONNREFUSED') {
        verifyErrorMsg = 'SMTP server refused connection - check host and port';
      } else if (verifyError.code === 'ENOTFOUND') {
        verifyErrorMsg = 'SMTP server not found - check host address';
      } else if (verifyError.code === 'ETIMEDOUT') {
        verifyErrorMsg = 'SMTP server connection timeout - server may be down';
      } else if (verifyError.code === 'EAUTH' || verifyError.responseCode === 535) {
        verifyErrorMsg = 'SMTP authentication failed - check username/password';
      }
      
      throw new Error(`${verifyErrorMsg}: ${verifyError.message}`);
    }

    // ✅ SEND EMAIL with comprehensive error catching
    console.log('📤 Sending email...');
    const startTime = Date.now();
    
    let emailResult = await transporter.sendMail({
      from: `"${process.env.WebName || 'BetaBase'}" <${process.env.USER}>`, // Professional sender format
      to: email,
      subject: subject,
      text: text,
      html: text.replace(/\n/g, '<br>'), // Auto-convert newlines to HTML
      // ✅ EMAIL HEADERS for better deliverability
      headers: {
        'X-Mailer': 'BetaBase Email System',
        'X-Priority': '3',
        'Importance': 'Normal'
      }
    });

    const sendTime = Date.now() - startTime;
    console.log(`✅ Email sent successfully to: ${email} (${sendTime}ms)`);
    console.log(`📧 Message ID: ${emailResult.messageId}`);
    console.log(`📧 Response: ${emailResult.response}`);
    
    // ✅ CLOSE CONNECTION to prevent memory leaks
    transporter.close();
    
    return {
      success: true,
      messageId: emailResult.messageId,
      response: emailResult.response,
      sendTime: sendTime
    };

  } catch (error) {
    console.log("❌ Email FAILED to send to:", email);
    console.error("📧 Email error details:", error);
    
    // ✅ COMPREHENSIVE ERROR CLASSIFICATION
    let errorMessage = 'Unknown email error';
    let errorCode = 'UNKNOWN';
    let retryable = false;
    
    // ✅ NETWORK & CONNECTION ERRORS
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'SMTP server refused connection - server may be down';
      errorCode = 'CONNECTION_REFUSED';
      retryable = true;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'SMTP server not found - DNS resolution failed';
      errorCode = 'DNS_ERROR';
      retryable = false;
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = 'SMTP connection timeout - server not responding';
      errorCode = 'TIMEOUT';
      retryable = true;
    } else if (error.code === 'ECONNRESET') {
      errorMessage = 'SMTP connection reset by server';
      errorCode = 'CONNECTION_RESET';
      retryable = true;
    } else if (error.code === 'EPIPE') {
      errorMessage = 'SMTP connection broken during transmission';
      errorCode = 'BROKEN_PIPE';
      retryable = true;
    }
    
    // ✅ AUTHENTICATION ERRORS
    else if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorMessage = 'SMTP authentication failed - invalid username/password';
      errorCode = 'AUTH_FAILED';
      retryable = false;
    } else if (error.responseCode === 454) {
      errorMessage = 'SMTP temporary authentication failure - too many login attempts';
      errorCode = 'AUTH_TEMP_FAIL';
      retryable = true;
    }
    
    // ✅ RATE LIMITING & QUOTA ERRORS
    else if (error.message?.includes('Mailbox quota') || error.message?.includes('quota exceeded')) {
      errorMessage = 'SMTP mailbox quota exceeded - daily/hourly limit reached';
      errorCode = 'QUOTA_EXCEEDED';
      retryable = true;
    } else if (error.message?.includes('rate limit') || error.message?.includes('too many') || error.message?.includes('Too many login attempts')) {
      errorMessage = 'SMTP rate limit exceeded - too many emails sent';
      errorCode = 'RATE_LIMITED';
      retryable = true;
    } else if (error.responseCode === 421) {
      errorMessage = 'SMTP service temporarily unavailable - server overloaded';
      errorCode = 'SERVICE_UNAVAILABLE';
      retryable = true;
    } else if (error.responseCode === 450 || error.responseCode === 451) {
      errorMessage = 'SMTP temporary failure - mailbox temporarily unavailable';
      errorCode = 'TEMP_FAILURE';
      retryable = true;
    }
    
    // ✅ RECIPIENT & CONTENT ERRORS
    else if (error.responseCode === 550) {
      errorMessage = 'Email rejected - recipient address invalid or blocked';
      errorCode = 'RECIPIENT_REJECTED';
      retryable = false;
    } else if (error.responseCode === 552) {
      errorMessage = 'Email rejected - message size exceeds limit';
      errorCode = 'MESSAGE_TOO_LARGE';
      retryable = false;
    } else if (error.responseCode === 553) {
      errorMessage = 'Email rejected - sender address invalid';
      errorCode = 'SENDER_REJECTED';
      retryable = false;
    } else if (error.responseCode === 554) {
      errorMessage = 'Email rejected - content blocked by spam filter';
      errorCode = 'CONTENT_BLOCKED';
      retryable = false;
    }
    
    // ✅ TLS/SSL ERRORS
    else if (error.code === 'CERT_HAS_EXPIRED') {
      errorMessage = 'SMTP server SSL certificate has expired';
      errorCode = 'SSL_CERT_EXPIRED';
      retryable = false;
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      errorMessage = 'SMTP server SSL certificate verification failed';
      errorCode = 'SSL_VERIFICATION_FAILED';
      retryable = false;
    }
    
    // ✅ GENERIC FALLBACK
    else if (error.message) {
      errorMessage = error.message;
      errorCode = 'GENERIC_ERROR';
      retryable = true;
    }
    
    // ✅ ENHANCED ERROR LOGGING
    console.error('🚨 EMAIL FAILURE ANALYSIS:');
    console.error(`   📧 Recipient: ${email}`);
    console.error(`   🏷️  Subject: ${subject?.substring(0, 50) || 'N/A'}`);
    console.error(`   ❌ Error Code: ${errorCode}`);
    console.error(`   📝 Error Message: ${errorMessage}`);
    console.error(`   🔄 Retryable: ${retryable}`);
    console.error(`   📊 SMTP Response Code: ${error.responseCode || 'N/A'}`);
    console.error(`   🔧 System Error Code: ${error.code || 'N/A'}`);
    console.error(`   📍 Error Stack:`, error.stack);
    
    // ✅ STRUCTURED ERROR OBJECT
    const structuredError = new Error(errorMessage);
    structuredError.code = errorCode;
    structuredError.originalError = error;
    structuredError.retryable = retryable;
    structuredError.responseCode = error.responseCode;
    structuredError.recipient = email;
    structuredError.timestamp = new Date().toISOString();
    
    // ✅ CRITICAL ERROR ALERTING
    if (['AUTH_FAILED', 'DNS_ERROR', 'SSL_CERT_EXPIRED'].includes(errorCode)) {
      console.error('🚨🚨🚨 CRITICAL EMAIL SYSTEM ERROR - IMMEDIATE ATTENTION REQUIRED!');
      console.error('This error will prevent ALL emails from being sent until fixed!');
    }
    
    throw structuredError;
  }
};