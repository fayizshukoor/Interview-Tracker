import client from './client';
import type { Candidate } from '../types/candidate';

export async function getCandidates(): Promise<Candidate[]> {
  const response = await client.get<Candidate[]>('/candidates');
  return response.data;
}

export async function createCandidate(name: string): Promise<Candidate> {
  const response = await client.post<Candidate>('/candidates', { name });
  return response.data;
}
