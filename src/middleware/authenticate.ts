import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    const token = authorization.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & {
            userId?: string;
            email?: string;
        };

        if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
            res.status(401).json({ error: 'Invalid authentication token.' });
            return;
        }

        (req as AuthenticatedRequest).user = {
            id: payload.userId,
            email: payload.email,
        };

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
}
