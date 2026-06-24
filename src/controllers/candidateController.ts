import type { Request, Response } from 'express';
import * as candidateService from '../services/candidateService.js';

export async function createCandidate(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body as { name?: string };

    if (typeof name !== 'string') {
      res.status(400).json({ error: 'name is required and must be a string.' });
      return;
    }

    const candidate = await candidateService.createCandidate(name);
    res.status(201).json(candidate);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('cannot be empty') || message.includes('already exists')) {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

export async function getCandidate(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const candidate = await candidateService.getCandidate(id);
    res.status(200).json(candidate);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

export async function getAllCandidates(_req: Request, res: Response): Promise<void> {
  try {
    const candidates = await candidateService.getAllCandidates();
    res.status(200).json(candidates);
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
}
