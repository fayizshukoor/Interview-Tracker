import type { Request, Response } from 'express';
import * as service from '../services/practicalQuestionService.js';

function statusFromError(message: string): number {
  if (message.includes('not found'))      return 404;
  if (message.includes('cannot be empty')) return 400;
  return 500;
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { taskText, expectedAnswer, topic } = req.body as {
      taskText?: string; expectedAnswer?: string; topic?: string;
    };
    if (typeof taskText !== 'string' || typeof topic !== 'string') {
      res.status(400).json({ error: 'taskText and topic are required.' });
      return;
    }
    const q = await service.createPracticalQuestion(
      taskText,
      typeof expectedAnswer === 'string' ? expectedAnswer : null,
      topic,
    );
    res.status(201).json(q);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(msg)).json({ error: msg });
  }
}

export async function listQuestions(req: Request, res: Response): Promise<void> {
  try {
    const topic  = typeof req.query['topic']  === 'string' ? req.query['topic']  : undefined;
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;
    const questions = await service.getAllPracticalQuestions({ topic, search });
    res.status(200).json(questions);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(500).json({ error: msg });
  }
}

export async function getTopics(_req: Request, res: Response): Promise<void> {
  try {
    const topics = await service.getPracticalTopics();
    res.status(200).json({ topics });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(500).json({ error: msg });
  }
}

export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    await service.deletePracticalQuestion(req.params['id'] as string);
    res.status(200).json({ message: 'Practical question deleted successfully.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(msg)).json({ error: msg });
  }
}
