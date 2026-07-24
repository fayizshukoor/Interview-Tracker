import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import * as userService from '../services/userService.js';
import { env } from '../config/env.js';

function signToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.jwtSecret, {
        expiresIn: env.jwtExpiry as SignOptions['expiresIn'],
    });
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body as { email?: string; password?: string };
        if (typeof email !== 'string' || typeof password !== 'string') {
            res.status(400).json({ error: 'email and password are required.' });
            return;
        }

        const user = await userService.registerUser(email, password);
        const token = signToken(user.id, user.email);

        res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        if (message.includes('valid email') || message.includes('Password must') || message.includes('Email is already in use')) {
            res.status(400).json({ error: message });
        } else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body as { email?: string; password?: string };
        if (typeof email !== 'string' || typeof password !== 'string') {
            res.status(400).json({ error: 'email and password are required.' });
            return;
        }

        const user = await userService.authenticateUser(email, password);
        const token = signToken(user.id, user.email);

        res.status(200).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        if (message.includes('Invalid email or password.')) {
            res.status(401).json({ error: message });
        } else {
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    const authReq = req as Request & { user?: { id: string; email: string } };
    if (!authReq.user) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
    }

    res.status(200).json({ id: authReq.user.id, email: authReq.user.email });
}
