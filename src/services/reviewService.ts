import * as reviewRepository from '../repositories/reviewRepository.js';
import * as candidateRepository from '../repositories/candidateRepository.js';
import * as reviewTheoryQuestionRepository from '../repositories/reviewTheoryQuestionRepository.js';
import * as reviewPracticalTaskRepository from '../repositories/reviewPracticalTaskRepository.js';
import type { Review } from '../types/index.js';

export async function createReview(candidateId: string): Promise<Review> {
  const candidate = await candidateRepository.findById(candidateId);

  if (!candidate) {
    throw new Error(`Candidate with id "${candidateId}" not found.`);
  }

  const existingDraft = await reviewRepository.findDraftByCandidateId(candidateId);
  if (existingDraft) {
    return existingDraft;
  }

  return reviewRepository.create(candidateId);
}

export async function getReview(id: string): Promise<Review> {
  const review = await reviewRepository.findById(id);

  if (!review) {
    throw new Error(`Review with id "${id}" not found.`);
  }

  return review;
}

export async function finalizeReview(reviewId: string): Promise<Review> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  const questions = await reviewTheoryQuestionRepository.findByReviewId(reviewId);
  if (questions.length === 0) {
    throw new Error('Review contains no questions.');
  }

  // Compute theory score
  const correctCount = questions.filter((q) => q.result === 'correct').length;
  const theoryScore  = parseFloat(((correctCount / questions.length) * 100).toFixed(2));

  // Compute practical score — average of all scored tasks (ignore unscored)
  const tasks = await reviewPracticalTaskRepository.findByReviewId(reviewId);
  const scoredTasks = tasks.filter((t) => t.score !== null);
  const practicalScore = scoredTasks.length > 0
    ? parseFloat((scoredTasks.reduce((sum, t) => sum + t.score!, 0) / scoredTasks.length).toFixed(2))
    : null;

  const finalized = await reviewRepository.updateFinalizedReview(reviewId, theoryScore, practicalScore);
  if (!finalized) {
    throw new Error('Review not found.');
  }

  return finalized;
}

export async function updateReviewFeedback(reviewId: string, feedback: string): Promise<Review> {
  const trimmed = feedback.trim();

  if (!trimmed) {
    throw new Error('Feedback cannot be empty.');
  }

  const review = await reviewRepository.findById(reviewId);
  if (!review) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  const updated = await reviewRepository.updateFeedback(reviewId, trimmed);
  if (!updated) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  return updated;
}

export async function listReviews(params: {
  candidateId?: string;
  status?: string;
} = {}): Promise<(Review & { candidateName: string; questionCount: number })[]> {
  return reviewRepository.findAll(params);
}
