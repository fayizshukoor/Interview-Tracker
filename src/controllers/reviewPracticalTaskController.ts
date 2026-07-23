import type { Request, Response } from 'express';
import * as service from '../services/reviewPracticalTaskService.js';

function statusFromError(message: string): number {
  if (message.includes('not found'))      return 404;
  if (message.includes('cannot be empty') ||
      message.includes('must be between')) return 400;
  return 500;
}

export async function addPracticalTask(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params['reviewId'] as string;
    const { taskText, expectedAnswer } = req.body as {
      taskText?: string;
      expectedAnswer?: string;
    };

    if (typeof taskText !== 'string') {
      res.status(400).json({ error: 'taskText is required.' });
      return;
    }

    const task = await service.addPracticalTask(
      reviewId,
      taskText,
      typeof expectedAnswer === 'string' ? expectedAnswer : null,
    );
    res.status(201).json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function getPracticalTasks(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params['reviewId'] as string;
    const tasks = await service.getPracticalTasks(reviewId);
    res.status(200).json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function scorePracticalTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = req.params['taskId'] as string;
    const { score } = req.body as { score?: unknown };

    if (typeof score !== 'number') {
      res.status(400).json({ error: 'score must be a number.' });
      return;
    }

    const task = await service.scorePracticalTask(taskId, score);
    res.status(200).json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function deletePracticalTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = req.params['taskId'] as string;
    await service.deletePracticalTask(taskId);
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}
