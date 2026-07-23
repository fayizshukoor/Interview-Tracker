import client from './client';
import type { PracticalQuestion } from '../types/review';

export async function getPracticalQuestions(params?: {
  topic?: string;
  search?: string;
}): Promise<PracticalQuestion[]> {
  const response = await client.get<PracticalQuestion[]>('/practical-questions', { params });
  return response.data;
}

export async function getPracticalTopics(): Promise<string[]> {
  const response = await client.get<{ topics: string[] }>('/practical-questions/topics');
  return response.data.topics;
}

export async function createPracticalQuestion(payload: {
  taskText: string;
  expectedAnswer?: string;
  topic: string;
}): Promise<PracticalQuestion> {
  const response = await client.post<PracticalQuestion>('/practical-questions', payload);
  return response.data;
}

export async function deletePracticalQuestion(id: string): Promise<void> {
  await client.delete(`/practical-questions/${id}`);
}
