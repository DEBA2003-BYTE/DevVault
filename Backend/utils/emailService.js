const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate 4-digit OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Send OTP email
async function sendOTP(recipientEmail, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Your MFA Verification Code',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Multi-Factor Authentication</h2>
        <p>Your verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 20px; text-align: center; letter-spacing: 5px; color: #4CAF50;">
          ${otp}
        </h1>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
}

// Send high risk warning email
async function sendHighRiskWarning(recipientEmail, username) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: '⚠️ High Risk Score Detected - DEVVAULT',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">⚠️ High Risk Score Alert</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>We detected a high risk score during your recent login attempt.</p>
        <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Risk Level:</strong> Medium-High</p>
          <p style="margin: 5px 0 0 0; color: #856404;">Additional verification (OTP) was required for your security.</p>
        </div>
        <p>If this wasn't you, please contact the administrator immediately.</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated security notification from DEVVAULT.</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending high risk warning:', error);
        return false;
    }
}

// Send blocked notification email
async function sendBlockedNotification(recipientEmail, username) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: '🚫 Account Blocked - DEVVAULT',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">🚫 Account Temporarily Blocked</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Your account has been temporarily blocked due to a very high risk score detected during login.</p>
        <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #c62828;"><strong>Block Duration:</strong> 4 hours</p>
          <p style="margin: 5px 0 0 0; color: #c62828;">You can also contact the administrator to unblock your account earlier.</p>
        </div>
        <p><strong>What to do:</strong></p>
        <ul>
          <li>Wait for 4 hours before attempting to login again</li>
          <li>Contact admin@gmail.com to request early unblock</li>
          <li>Ensure you're logging in from your registered location</li>
        </ul>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated security notification from DEVVAULT.</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending blocked notification:', error);
        return false;
    }
}

// Send forgot password email
async function sendForgotPassword(recipientEmail, username, password) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: '🔑 Your Password - DEVVAULT',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">🔑 Password Recovery</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>You requested your password. Here it is:</p>
        <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1565c0;"><strong>Your Password:</strong> ${password}</p>
        </div>
        <p style="color: #ff5722;"><strong>Security Recommendation:</strong> Please change your password after logging in.</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this, please contact the administrator immediately.</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending forgot password email:', error);
        return false;
    }
}

module.exports = {
    generateOTP,
    sendOTP,
    sendHighRiskWarning,
    sendBlockedNotification,
    sendForgotPassword
};

