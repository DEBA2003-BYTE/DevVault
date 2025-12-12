require('dotenv').config();
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

// Send test email
async function sendTestEmail() {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'debarghya.1si23cs042@gmail.com',
        subject: 'Nodemailer Test',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nodemailer Test</h2>
        <p>Hi,</p>
        <p>This is a test email to verify that nodemailer is working correctly.</p>
        <p style="background: #f4f4f4; padding: 20px; text-align: center; color: #4CAF50;">
          ✅ Nodemailer is working!
        </p>
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
      </div>
    `
    };

    try {
        console.log('Sending test email...');
        console.log('From:', process.env.EMAIL_USER);
        console.log('To: debarghya.1si23cs042@gmail.com');

        const info = await transporter.sendMail(mailOptions);

        console.log('\n✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);

    } catch (error) {
        console.error('\n❌ Error sending email:');
        console.error('Error message:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n⚠️  Authentication failed. Please check:');
            console.error('1. EMAIL_USER is correct in your .env file');
            console.error('2. EMAIL_PASSWORD is an App Password (not your regular Gmail password)');
            console.error('3. 2-Step Verification is enabled on your Gmail account');
            console.error('\nTo create an App Password:');
            console.error('- Go to https://myaccount.google.com/apppasswords');
            console.error('- Generate a new app password for "Mail"');
            console.error('- Use that 16-character password in your .env file');
        } else if (error.code === 'ECONNECTION') {
            console.error('\n⚠️  Connection failed. Please check:');
            console.error('1. Your internet connection');
            console.error('2. EMAIL_HOST and EMAIL_PORT in your .env file');
        }
    }
}

sendTestEmail();
