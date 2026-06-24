import type { Request, Response } from 'express';
import * as questionService from '../services/questionService.js';

// Maps a service error message to the correct HTTP status code.
// Validation errors (empty fields)  → 400
// Not found errors                  → 404
// Anything else                     → 500
function statusFromError(message: string): number {
  if (message.includes('cannot be empty')) return 400;
  if (message.includes('not found'))       return 404;
  return 500;
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { questionText, expectedAnswer, topic } = req.body as {
      questionText?: string;
      expectedAnswer?: string;
      topic?: string;
    };

    if (typeof questionText  !== 'string' ||
        typeof expectedAnswer !== 'string' ||
        typeof topic          !== 'string') {
      res.status(400).json({ error: 'questionText, expectedAnswer, and topic are required.' });
      return;
    }

    const question = await questionService.createQuestion(questionText, expectedAnswer, topic);
    res.status(201).json(question);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const question = await questionService.getQuestion(id);
    res.status(200).json(question);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}

export async function getAllQuestions(_req: Request, res: Response): Promise<void> {
  try {
    const questions = await questionService.getAllQuestions();
    res.status(200).json(questions);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(500).json({ error: message });
  }
}

export async function getQuestionsByTopic(req: Request, res: Response): Promise<void> {
  try {
    const topic = req.query['topic'] as string | undefined;

    if (!topic || topic.trim().length === 0) {
      res.status(400).json({ error: 'topic query parameter is required.' });
      return;
    }

    const questions = await questionService.getQuestionsByTopic(topic);
    res.status(200).json(questions);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(500).json({ error: message });
  }
}

export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    await questionService.deleteQuestion(id);
    res.status(200).json({ message: 'Question deleted successfully.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    res.status(statusFromError(message)).json({ error: message });
  }
}
