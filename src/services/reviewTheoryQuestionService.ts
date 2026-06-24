import * as reviewTheoryQuestionRepository from '../repositories/reviewTheoryQuestionRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as reviewRepository from '../repositories/reviewRepository.js';
import * as reviewPendingTopicRepository from '../repositories/reviewPendingTopicRepository.js';
import type { ReviewTheoryQuestion, QuestionResult } from '../types/index.js';

export async function addQuestionsToReview(
  reviewId: string,
  questionIds: string[],
): Promise<ReviewTheoryQuestion[]> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  // Validate every question exists before inserting any
  const questions = await Promise.all(
    questionIds.map((qId) => questionRepository.findById(qId)),
  );

  const missing = questionIds.filter((_, i) => questions[i] === null);
  if (missing.length > 0) {
    throw new Error(`Questions not found: ${missing.join(', ')}.`);
  }

  // Insert snapshots for each question
  const added = await Promise.all(
    questions.map((q) => {
      const question = q!;
      return reviewTheoryQuestionRepository.create(
        reviewId,
        question.id,
        question.questionText,
        question.expectedAnswer,
        question.topic,
      );
    }),
  );

  return added;
}

export async function getQuestionsForReview(
  reviewId: string,
): Promise<ReviewTheoryQuestion[]> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  return reviewTheoryQuestionRepository.findByReviewId(reviewId);
}

export async function markQuestionResult(
  reviewTheoryQuestionId: string,
  result: QuestionResult,
): Promise<ReviewTheoryQuestion> {
  const updated = await reviewTheoryQuestionRepository.updateResult(
    reviewTheoryQuestionId,
    result,
  );

  if (!updated) {
    throw new Error(`Review question with id "${reviewTheoryQuestionId}" not found.`);
  }

  if (result === 'incorrect') {
    await reviewPendingTopicRepository.create(
      updated.reviewId,
      updated.topic,
      updated.questionText,
    );
  }

  return updated;
}

export async function addRandomQuestionsToReview(
  reviewId: string,
  count: number,
  topic?: string,
): Promise<ReviewTheoryQuestion[]> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  if (count <= 0) {
    throw new Error('Count must be greater than zero.');
  }

  const pool = topic
    ? await questionRepository.findByTopic(topic)
    : await questionRepository.findAll();

  if (pool.length < count) {
    throw new Error('Not enough questions available.');
  }

  // Fisher-Yates partial shuffle — pick `count` unique questions in O(count)
  const shuffled = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (shuffled.length - i));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const selected = shuffled.slice(0, count);

  const added = await Promise.all(
    selected.map((q) =>
      reviewTheoryQuestionRepository.create(
        reviewId,
        q.id,
        q.questionText,
        q.expectedAnswer,
        q.topic,
      ),
    ),
  );

  return added;
}
