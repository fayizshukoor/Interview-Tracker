import type { Request, Response } from 'express';
import * as reviewService from '../services/reviewService.js';

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const { candidateId } = req.body as { candidateId?: string };

    if (typeof candidateId !== 'string' || candidateId.trim().length === 0) {
      res.status(400).json({ error: 'candidateId is required.' });
      return;
    }

    const review = await reviewService.createReview(candidateId);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

export async function getReview(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const review = await reviewService.getReview(id);
    res.status(200).json(review);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}
