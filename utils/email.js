const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

console.log('Email config:', {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD ? '***' : 'MISSING'
});

exports.sendPasswordResetEmail = async (to, resetUrl) => {
    console.log("Preparing to send password reset email to:", to);
    try {
        const mailOptions = {
            from: '"Your App" <no-reply@yourapp.com>',
            to,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
            html: `<p>You requested a password reset. Please click the following link to reset your password:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>
                   <p>This link will expire in 1 hour.</p>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; 
    }
};


exports.sendPasswordResetConfirmation = async (to) => {
    try {
        const mailOptions = {
            from: '"Your App" <no-reply@yourapp.com>',
            to,
            subject: 'Password Reset Confirmation',
            text: 'Your password has been successfully reset. If you did not request this change, please contact us immediately.',
            html: `<p>Your password has been successfully reset.</p>
                   <p>If you did not request this change, please contact us immediately.</p>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        throw error;
    }
};