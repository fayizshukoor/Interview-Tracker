import client from './client';
import type { Question, CreateQuestionPayload } from '../types/question';

export async function getQuestions(): Promise<Question[]> {
  const response = await client.get<Question[]>('/questions');
  return response.data;
}

export async function getQuestionsByTopic(topic: string): Promise<Question[]> {
  const response = await client.get<Question[]>('/questions/topic/search', {
    params: { topic },
  });
  return response.data;
}

export async function createQuestion(payload: CreateQuestionPayload): Promise<Question> {
  const response = await client.post<Question>('/questions', payload);
  return response.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await client.delete(`/questions/${id}`);
}
