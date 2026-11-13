import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[server] ${req.method} ${req.originalUrl} failed:`, error);

    if (res.headersSent) return;
    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({ error: 'Request body contains invalid JSON.' });
        return;
    }
    res.status(500).json({ error: 'Internal server error.' });
};
