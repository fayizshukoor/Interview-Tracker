import type { Request, Response } from 'express';
import * as reviewTheoryQuestionService from '../services/reviewTheoryQuestionService.js';
import type { QuestionResult } from '../types/index.js';

const VALID_RESULTS: QuestionResult[] = ['correct', 'incorrect'];

function statusFromError(message: string): number {
  if (message.includes('not found'))              return 404;
  if (message.includes('not enough questions') ||
      message.includes('greater than zero'))       return 400;
  return 500;
}

export async function addQuestionsToReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params['reviewId'] as string;
    const { questionIds } = req.body as { questionIds?: unknown };

    if (
      !Array.isArray(questionIds) ||
      questionIds.length === 0 ||
      questionIds.some((id) => typeof id !== 'string')
    ) {
      res.status(400).json({ error: 'questionIds must be a non-empty array of strings.' });
      return;
    }

    const added = await reviewTheoryQuestionService.addQuestionsToReview(
      reviewId,
      questionIds as string[],
    );
    res.status(201).json(added);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function getQuestionsForReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params['reviewId'] as string;
    const questions = await reviewTheoryQuestionService.getQuestionsForReview(reviewId);
    res.status(200).json(questions);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function markQuestionResult(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const { result } = req.body as { result?: unknown };

    if (!result || !VALID_RESULTS.includes(result as QuestionResult)) {
      res.status(400).json({ error: 'result must be "correct" or "incorrect".' });
      return;
    }

    const updated = await reviewTheoryQuestionService.markQuestionResult(
      id,
      result as QuestionResult,
    );
    res.status(200).json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function addRandomQuestionsToReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params['reviewId'] as string;
    const { count, topic } = req.body as { count?: unknown; topic?: unknown };

    if (typeof count !== 'number' || !Number.isInteger(count) || count <= 0) {
      res.status(400).json({ error: 'count must be a positive integer.' });
      return;
    }

    const added = await reviewTheoryQuestionService.addRandomQuestionsToReview(
      reviewId,
      count,
      typeof topic === 'string' ? topic : undefined,
    );
    res.status(201).json(added);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}
