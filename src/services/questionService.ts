import * as questionRepository from '../repositories/questionRepository.js';
import type { Question } from '../types/index.js';

export async function createQuestion(
  questionText: string,
  expectedAnswer: string,
  topic: string,
): Promise<Question> {
  const trimmedText   = questionText.trim();
  const trimmedAnswer = expectedAnswer.trim();
  const trimmedTopic  = topic.trim();

  if (!trimmedText)   throw new Error('Question text cannot be empty.');
  if (!trimmedAnswer) throw new Error('Expected answer cannot be empty.');
  if (!trimmedTopic)  throw new Error('Topic cannot be empty.');

  return questionRepository.create(trimmedText, trimmedAnswer, trimmedTopic);
}

export async function getQuestion(id: string): Promise<Question> {
  const question = await questionRepository.findById(id);

  if (!question) {
    throw new Error(`Question with id "${id}" not found.`);
  }

  return question;
}

export async function getAllQuestions(): Promise<Question[]> {
  return questionRepository.findAll();
}

export async function getQuestionsByTopic(topic: string): Promise<Question[]> {
  return questionRepository.findByTopic(topic.trim());
}

export async function deleteQuestion(id: string): Promise<void> {
  const deleted = await questionRepository.deleteById(id);

  if (!deleted) {
    throw new Error(`Question with id "${id}" not found.`);
  }
}
