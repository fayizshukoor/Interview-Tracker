import * as repo from '../repositories/practicalQuestionRepository.js';
import type { PracticalQuestion } from '../types/index.js';

export async function createPracticalQuestion(
  taskText: string,
  expectedAnswer: string | null,
  topic: string,
): Promise<PracticalQuestion> {
  if (!taskText.trim())  throw new Error('Task text cannot be empty.');
  if (!topic.trim())     throw new Error('Topic cannot be empty.');
  return repo.create(taskText.trim(), expectedAnswer?.trim() || null, topic.trim());
}

export async function getPracticalQuestion(id: string): Promise<PracticalQuestion> {
  const q = await repo.findById(id);
  if (!q) throw new Error(`Practical question with id "${id}" not found.`);
  return q;
}

export async function getAllPracticalQuestions(params: {
  topic?: string;
  search?: string;
} = {}): Promise<PracticalQuestion[]> {
  return repo.findAll(params);
}

export async function getPracticalTopics(): Promise<string[]> {
  return repo.findAllTopics();
}

export async function deletePracticalQuestion(id: string): Promise<void> {
  const deleted = await repo.softDelete(id);
  if (!deleted) throw new Error(`Practical question with id "${id}" not found.`);
}
