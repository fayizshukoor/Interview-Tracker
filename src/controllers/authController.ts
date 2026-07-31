import type { Request, Response } from 'express';
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';

function publicUser(user: { id: string; email: string }) {
    return { id: user.id, email: user.email };
}

function sendAuthResponse(res: Response, status: number, user: { id: string; email: string }, tokens: authService.AuthTokens): void {
    res.status(status).json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: publicUser(user) });
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function field(body: unknown, name: string): unknown {
    return isObject(body) ? body[name] : undefined;
}

function isDatabaseUniqueViolation(error: unknown): boolean {
    return isObject(error) && error.code === '23505';
}

function logAuthError(req: Request, error: unknown, status: number): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[auth] ${req.method} ${req.originalUrl} returned ${status}: ${message}`, error);
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
    try {
        const email = field(req.body, 'email');
        if (typeof email !== 'string' || !email.trim()) { res.status(400).json({ error: 'Email is required.' }); return; }
        const code = await authService.requestOtp(email);
        const response: { message: string; otp?: string } = { message: 'Verification code sent.' };
        if (process.env['NODE_ENV'] !== 'production') response.otp = code;
        res.status(200).json(response);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        if (message.includes('valid email') || message.includes('wait')) { logAuthError(req, err, 400); res.status(400).json({ error: message }); }
        else { logAuthError(req, err, 503); res.status(503).json({ error: message.includes('SMTP') || message.includes('email service') ? message : 'Unable to send verification email right now.' }); }
    }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
    const email = field(req.body, 'email');
    const code = field(req.body, 'code');
    if (typeof email !== 'string' || !email.trim() || typeof code !== 'string' || !code.trim()) { res.status(400).json({ error: 'Email and verification code are required.' }); return; }
    if (!/^\d{6}$/.test(code)) { res.status(400).json({ error: 'Verification code must be exactly 6 digits.' }); return; }
    const valid = await authService.verifyOtp(email, code);
    res.status(valid ? 200 : 400).json(valid ? { verified: true } : { error: 'Invalid or expired verification code.' });
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const email = field(req.body, 'email');
        const password = field(req.body, 'password');
        const otp = field(req.body, 'otp');
        if (typeof email !== 'string' || typeof password !== 'string' || typeof otp !== 'string') { res.status(400).json({ error: 'Email, password and verification code are required.' }); return; }
        userService.validateRegistration(email, password);
        if (!/^\d{6}$/.test(otp)) { res.status(400).json({ error: 'Verification code must be exactly 6 digits.' }); return; }
        if (!await authService.consumeOtp(email, otp)) { res.status(400).json({ error: 'Invalid or expired verification code.' }); return; }
        const user = await userService.registerUser(email, password);
        sendAuthResponse(res, 201, user, await authService.issueTokens(user));
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        if (isDatabaseUniqueViolation(err) || message.includes('Email is already in use')) { logAuthError(req, err, 409); res.status(409).json({ error: 'Email is already in use.' }); }
        else if (message.includes('valid email') || message.includes('Password must') || message.includes('required')) { logAuthError(req, err, 400); res.status(400).json({ error: message }); }
        else { logAuthError(req, err, 500); res.status(500).json({ error: 'Internal server error.' }); }
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const email = field(req.body, 'email');
        const password = field(req.body, 'password');
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) { res.status(400).json({ error: 'Email and password are required.' }); return; }
        userService.validateEmail(email);
        const user = await userService.authenticateUser(email, password);
        sendAuthResponse(res, 200, user, await authService.issueTokens(user));
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        if (message.includes('Invalid email or password.')) { logAuthError(req, err, 401); res.status(401).json({ error: message }); }
        else if (message.includes('valid email') || message.includes('required')) { logAuthError(req, err, 400); res.status(400).json({ error: message }); }
        else { logAuthError(req, err, 500); res.status(500).json({ error: 'Internal server error.' }); }
    }
}

export async function refresh(req: Request, res: Response): Promise<void> {
    try {
        const { refreshToken } = req.body as { refreshToken?: string };
        if (typeof refreshToken !== 'string' || !refreshToken) { res.status(401).json({ error: 'Refresh token is required.' }); return; }
        const result = await authService.rotateRefreshToken(refreshToken);
        sendAuthResponse(res, 200, result.user, result.tokens);
    } catch (err) {
        logAuthError(req, err, 401);
        res.status(401).json({ error: err instanceof Error ? err.message : 'Invalid refresh token.' });
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (typeof refreshToken === 'string' && refreshToken) await authService.revokeRefreshToken(refreshToken);
    res.status(204).send();
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    const authReq = req as Request & { user?: { id: string; email: string } };
    if (!authReq.user) { res.status(401).json({ error: 'Unauthorized.' }); return; }
    res.status(200).json(publicUser(authReq.user));
}
