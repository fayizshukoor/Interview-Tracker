import type { Request, Response } from 'express';
import * as reviewService from '../services/reviewService.js';

export async function listReviews(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = typeof req.query['candidateId'] === 'string'
      ? req.query['candidateId']
      : undefined;
    const status = typeof req.query['status'] === 'string'
      ? req.query['status']
      : undefined;

    const page = typeof req.query['page'] === 'string' ? parseInt(req.query['page'], 10) : undefined;
    const pageSize = typeof req.query['pageSize'] === 'string' ? parseInt(req.query['pageSize'], 10) : undefined;

    const result = await reviewService.listReviews({ candidateId, status, page, pageSize });
    res.setHeader('X-Total-Count', String(result.total));
    res.status(200).json(result.items);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(500).json({ error: message });
  }
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    await reviewService.deleteReview(id);
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

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

export async function finalizeReview(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const review = await reviewService.finalizeReview(id);
    res.status(200).json(review);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('no questions')) {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

export async function updateReviewFeedback(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const { feedback } = req.body as { feedback?: string };

    if (typeof feedback !== 'string') {
      res.status(400).json({ error: 'feedback is required and must be a string.' });
      return;
    }

    const review = await reviewService.updateReviewFeedback(id, feedback);
    res.status(200).json(review);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('cannot be empty')) {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}
