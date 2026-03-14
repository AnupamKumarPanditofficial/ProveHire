const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter using Gmail or your preferred SMTP host
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // or use host and port for standard SMTP
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const message = {
        from: `ProvaHire Teams <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.htmlMessage || `<p>${options.message}</p>`,
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
