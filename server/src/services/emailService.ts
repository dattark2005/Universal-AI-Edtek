import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL;

export async function sendVerificationEmail(to: string, code: string) {
  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Verify your email address',
    html: `<p>Thank you for registering! Please verify your email by entering the following code:</p>
           <h2 style="letter-spacing: 4px;">${code}</h2>
           <p>This code will expire in 10 minutes.</p>`
  });
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Reset your password',
    html: `<p>You requested a password reset. Click the link below to set a new password:</p>
           <a href="${resetUrl}">Reset Password</a>`,
  });
} 