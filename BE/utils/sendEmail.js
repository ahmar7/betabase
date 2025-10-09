const nodemailer = require("nodemailer");

module.exports = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      //   secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    let data = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: text,
    });
    console.log("✅ Email sent successfully to:", email);
    return null; // null = success

  } catch (error) {
    console.log("❌ Email FAILED to send to:", email);
    console.error("Email error details:", error.message);
    
    // Extract meaningful error message
    let errorMessage = error.message || 'Unknown email error';
    
    // Check for common SMTP errors
    if (error.message?.includes('Mailbox quota') || error.message?.includes('quota exceeded')) {
      errorMessage = 'SMTP quota exceeded - daily/hourly limit reached';
    } else if (error.message?.includes('rate limit') || error.message?.includes('too many') || error.message?.includes('Too many login attempts')) {
      errorMessage = 'SMTP rate limit exceeded - too many emails sent';
      console.error('🚨🚨 RATE LIMIT HIT! Error code:', error.code, 'Response code:', error.responseCode);
    } else if (error.message?.includes('authentication') || error.code === 'EAUTH' || error.responseCode === 535 || error.responseCode === 454) {
      errorMessage = 'SMTP authentication/rate limit - too many login attempts';
      console.error('🚨 SMTP Auth/Rate issue detected');
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'SMTP timeout - server not responding';
    } else if (error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to SMTP server';
    }
    
    console.error('📧 Email failure reason:', errorMessage);
    
    // IMPORTANT: Throw error instead of returning it
    // This ensures Promise.allSettled catches it properly
    throw new Error(errorMessage);
  }
};
