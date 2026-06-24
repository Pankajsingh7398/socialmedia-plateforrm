const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP not configured - emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Social Media <noreply@socialmedia.com>',
    to,
    subject,
    html,
  };

  const transport = getTransporter();

  if (!transport) {
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
    logger.debug(html);
    return { success: true, dev: true };
  }

  try {
    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    throw error;
  }
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/#verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your email - Social Media',
    html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/#reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your password - Social Media',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name}, click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
