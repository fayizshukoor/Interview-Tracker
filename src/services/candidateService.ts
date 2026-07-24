import * as candidateRepository from '../repositories/candidateRepository.js';
import type { Candidate } from '../types/index.js';

export async function createCandidate(name: string, ownerId?: string | null): Promise<Candidate> {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new Error('Candidate name cannot be empty.');
  }

  const existing = await candidateRepository.findByName(trimmed, ownerId);
  if (existing) {
    throw new Error(`Candidate "${trimmed}" already exists.`);
  }

  return candidateRepository.create(trimmed, ownerId ?? null);
}

export async function getCandidate(id: string, ownerId?: string | null): Promise<Candidate> {
  const candidate = await candidateRepository.findById(id, ownerId);

  if (!candidate) {
    throw new Error(`Candidate with id "${id}" not found.`);
  }

  return candidate;
}

export async function getAllCandidates(ownerId?: string | null): Promise<Candidate[]> {
  return candidateRepository.findAll(ownerId ?? null);
}
