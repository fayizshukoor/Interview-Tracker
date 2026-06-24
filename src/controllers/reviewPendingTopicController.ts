import type { Request, Response } from 'express';
import * as reviewPendingTopicService from '../services/reviewPendingTopicService.js';

export async function getPendingTopicsForReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params['reviewId'] as string;
    const topics = await reviewPendingTopicService.getPendingTopicsForReview(reviewId);
    res.status(200).json(topics);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}
