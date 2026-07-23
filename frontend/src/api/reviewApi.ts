import client from './client';
import type { Review, ReviewTheoryQuestion, ReviewPendingTopic, ReviewListItem, ReviewPracticalTask } from '../types/review';

export async function createReview(candidateId: string): Promise<Review> {
  const response = await client.post<Review>('/reviews', { candidateId });
  return response.data;
}

export async function getReview(reviewId: string): Promise<Review> {
  const response = await client.get<Review>(`/reviews/${reviewId}`);
  return response.data;
}

export async function addManualQuestions(
  reviewId: string,
  questionIds: string[],
): Promise<ReviewTheoryQuestion[]> {
  const response = await client.post<ReviewTheoryQuestion[]>(
    `/reviews/${reviewId}/questions`,
    { questionIds },
  );
  return response.data;
}

export async function addRandomQuestions(
  reviewId: string,
  count: number,
  topic?: string,
): Promise<ReviewTheoryQuestion[]> {
  const response = await client.post<ReviewTheoryQuestion[]>(
    `/reviews/${reviewId}/questions/random`,
    { count, ...(topic ? { topic } : {}) },
  );
  return response.data;
}

export async function getReviewQuestions(
  reviewId: string,
): Promise<ReviewTheoryQuestion[]> {
  const response = await client.get<ReviewTheoryQuestion[]>(
    `/reviews/${reviewId}/questions`,
  );
  return response.data;
}

export async function markQuestionResult(
  reviewQuestionId: string,
  result: 'correct' | 'incorrect',
): Promise<ReviewTheoryQuestion> {
  const response = await client.patch<ReviewTheoryQuestion>(
    `/review-questions/${reviewQuestionId}/result`,
    { result },
  );
  return response.data;
}

export async function finalizeReview(reviewId: string): Promise<Review> {
  const response = await client.patch<Review>(`/reviews/${reviewId}/finalize`);
  return response.data;
}

export async function getPendingTopics(
  reviewId: string,
): Promise<ReviewPendingTopic[]> {
  const response = await client.get<ReviewPendingTopic[]>(`/reviews/${reviewId}/pending-topics`);
  return response.data;
}

export async function updateReviewFeedback(
  reviewId: string,
  feedback: string,
): Promise<Review> {
  const response = await client.patch<Review>(`/reviews/${reviewId}/feedback`, { feedback });
  return response.data;
}

export async function listReviews(params?: {
  candidateId?: string;
  status?: string;
}): Promise<ReviewListItem[]> {
  const response = await client.get<ReviewListItem[]>('/reviews', { params });
  return response.data;
}

// ── Practical tasks ────────────────────────────────────────────────────────

export async function addPracticalTask(
  reviewId: string,
  taskText: string,
  expectedAnswer?: string,
): Promise<ReviewPracticalTask> {
  const response = await client.post<ReviewPracticalTask>(
    `/reviews/${reviewId}/practical-tasks`,
    { taskText, ...(expectedAnswer ? { expectedAnswer } : {}) },
  );
  return response.data;
}

export async function getPracticalTasks(
  reviewId: string,
): Promise<ReviewPracticalTask[]> {
  const response = await client.get<ReviewPracticalTask[]>(
    `/reviews/${reviewId}/practical-tasks`,
  );
  return response.data;
}

export async function scorePracticalTask(
  taskId: string,
  score: number,
): Promise<ReviewPracticalTask> {
  const response = await client.patch<ReviewPracticalTask>(
    `/practical-tasks/${taskId}/score`,
    { score },
  );
  return response.data;
}

export async function deletePracticalTask(taskId: string): Promise<void> {
  await client.delete(`/practical-tasks/${taskId}`);
}
