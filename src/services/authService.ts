import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as authRepository from '../repositories/authRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { validateEmail } from './userService.js';
import * as emailService from './emailService.js';
import type { User } from '../types/index.js';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

const hash = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

function normalizeEmail(email: string): string {
    return validateEmail(email);
}

export function createAccessToken(user: User): string {
    return jwt.sign({ userId: user.id, email: user.email, type: 'access' }, env.jwtSecret, {
        expiresIn: env.jwtExpiry as SignOptions['expiresIn'],
    });
}

export async function issueTokens(user: User, familyId: string = crypto.randomUUID()): Promise<AuthTokens> {
    const refreshToken = crypto.randomBytes(64).toString('base64url');
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiryDays * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshToken(user.id, hash(refreshToken), familyId, expiresAt);
    return { accessToken: createAccessToken(user), refreshToken };
}

export async function rotateRefreshToken(rawToken: string): Promise<{ user: User; tokens: AuthTokens }> {
    const record = await authRepository.findRefreshToken(hash(rawToken));
    if (!record) throw new Error('Invalid refresh token.');
    if (record.revokedAt) {
        await authRepository.revokeFamily(record.familyId);
        throw new Error('Refresh token reuse detected.');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
        await authRepository.revokeRefreshToken(record.id);
        throw new Error('Refresh token has expired.');
    }

    const user = await userRepository.findById(record.userId);
    if (!user) throw new Error('Invalid refresh token.');
    await authRepository.revokeRefreshToken(record.id);
    return { user, tokens: await issueTokens(user, record.familyId) };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
    const record = await authRepository.findRefreshToken(hash(rawToken));
    if (record) await authRepository.revokeRefreshToken(record.id);
}

export async function requestOtp(email: string): Promise<string> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('A valid email address is required.');

    const latest = await authRepository.latestOtp(normalizedEmail);
    if (latest && Date.now() - latest.createdAt.getTime() < env.otpResendSeconds * 1000) {
        throw new Error('Please wait before requesting another verification code.');
    }

    const code = String(crypto.randomInt(100000, 1000000));
    if (emailService.isEmailConfigured()) {
        try {
            await emailService.sendOtpEmail(normalizedEmail, code);
        } catch {
            throw new Error('Unable to send the verification email. Check the SMTP configuration.');
        }
    } else if (process.env['NODE_ENV'] !== 'production') {
        console.info(`[auth] OTP for ${normalizedEmail}: ${code}`);
    } else {
        throw new Error('OTP email service is not configured.');
    }
    await authRepository.createOtp(normalizedEmail, hash(code), new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000));
    return code;
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
    const normalizedEmail = normalizeEmail(email);
    if (!/^\d{6}$/.test(code)) return false;
    return authRepository.isOtpValid(normalizedEmail, hash(code));
}

export async function consumeOtp(email: string, code: string): Promise<boolean> {
    return authRepository.consumeOtp(normalizeEmail(email), hash(code));
}
