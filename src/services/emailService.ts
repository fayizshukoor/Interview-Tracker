import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const smtpConfigured = Boolean(env.smtpHost && env.smtpUser && env.smtpPassword && env.smtpFrom);

export function isEmailConfigured(): boolean {
    return smtpConfigured;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
    if (!smtpConfigured || !env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.smtpFrom) {
        throw new Error('OTP email service is not configured. Set the SMTP environment variables.');
    }

    const transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: { user: env.smtpUser, pass: env.smtpPassword },
    });

    await transporter.sendMail({
        from: env.smtpFrom,
        to: email,
        subject: 'Interview Tracker email verification code',
        text: `Your Interview Tracker verification code is ${code}. It expires in ${env.otpExpiryMinutes} minutes.`,
        html: `<p>Your Interview Tracker verification code is:</p><h2>${code}</h2><p>This code expires in ${env.otpExpiryMinutes} minutes.</p>`,
    });
}
