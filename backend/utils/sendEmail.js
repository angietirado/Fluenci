const nodemailer = require('nodemailer');

const isEmailConfigured = () =>
    !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () =>
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

const sendEmail = async ({ to, subject, html, text }) => {
    if (!isEmailConfigured()) {
        throw new Error(
            'Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/config/config.env'
        );
    }

    const from = process.env.EMAIL_FROM || `"Fluenci" <${process.env.SMTP_USER}>`;
    const transporter = getTransporter();
    await transporter.sendMail({ from, to, subject, html, text });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
    const displayName = name || 'there';
    const subject = 'Fluenci — Reset your password';
    const text = `Hi ${displayName},\n\nYou requested a password reset. Open this link within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\n— Fluenci`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #00c4cc;">Reset your Fluenci password</h2>
            <p>Hi ${displayName},</p>
            <p>You requested a password reset. Click the button below — the link expires in <strong>1 hour</strong>.</p>
            <p style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}"
                   style="background: #00c4cc; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Reset password
                </a>
            </p>
            <p style="font-size: 13px; color: #666;">Or copy this link into your browser:<br/>
                <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="font-size: 13px; color: #999;">If you did not request this, you can safely ignore this email.</p>
        </div>
    `;

    await sendEmail({ to: email, subject, html, text });
};

module.exports = sendEmail;
module.exports.isEmailConfigured = isEmailConfigured;
module.exports.sendPasswordResetEmail = sendPasswordResetEmail;
