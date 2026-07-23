import * as repo from '../repositories/reviewPracticalTaskRepository.js';
import * as reviewRepository from '../repositories/reviewRepository.js';
import type { ReviewPracticalTask } from '../types/index.js';

export async function addPracticalTask(
  reviewId: string,
  taskText: string,
  expectedAnswer: string | null,
): Promise<ReviewPracticalTask> {
  const trimmed = taskText.trim();
  if (!trimmed) throw new Error('Task text cannot be empty.');

  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new Error(`Review with id "${reviewId}" not found.`);

  return repo.create(reviewId, trimmed, expectedAnswer?.trim() || null);
}

export async function getPracticalTasks(
  reviewId: string,
): Promise<ReviewPracticalTask[]> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new Error(`Review with id "${reviewId}" not found.`);

  return repo.findByReviewId(reviewId);
}

export async function scorePracticalTask(
  taskId: string,
  score: number,
): Promise<ReviewPracticalTask> {
  if (score < 0 || score > 100) throw new Error('Score must be between 0 and 100.');

  const updated = await repo.updateScore(taskId, score);
  if (!updated) throw new Error(`Practical task with id "${taskId}" not found.`);

  return updated;
}

export async function deletePracticalTask(taskId: string): Promise<void> {
  const deleted = await repo.deleteById(taskId);
  if (!deleted) throw new Error(`Practical task with id "${taskId}" not found.`);
}
