import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

if (!SENDGRID_API_KEY || !FROM_EMAIL) {
  throw new Error('SendGrid API key or FROM_EMAIL is not set in environment variables.');
}

sgMail.setApiKey(SENDGRID_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Verify your email address',
    html: `<p>Thank you for registering! Please verify your email by clicking the link below:</p>
           <a href="${verificationUrl}">Verify Email</a>`
  };
  await sgMail.send(msg);
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Reset your password',
    html: `<p>You requested a password reset. Click the link below to set a new password:</p>
           <a href="${resetUrl}">Reset Password</a>`
  };
  await sgMail.send(msg);
} 