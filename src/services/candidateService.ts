import * as candidateRepository from '../repositories/candidateRepository.js';
import type { Candidate } from '../types/index.js';

export async function createCandidate(name: string): Promise<Candidate> {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new Error('Candidate name cannot be empty.');
  }

  const existing = await candidateRepository.findByName(trimmed);
  if (existing) {
    throw new Error(`Candidate "${trimmed}" already exists.`);
  }

  return candidateRepository.create(trimmed);
}

export async function getCandidate(id: string): Promise<Candidate> {
  const candidate = await candidateRepository.findById(id);

  if (!candidate) {
    throw new Error(`Candidate with id "${id}" not found.`);
  }

  return candidate;
}

export async function getAllCandidates(): Promise<Candidate[]> {
  return candidateRepository.findAll();
}
