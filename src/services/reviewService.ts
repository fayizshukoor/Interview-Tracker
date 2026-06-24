import * as reviewRepository from '../repositories/reviewRepository.js';
import * as candidateRepository from '../repositories/candidateRepository.js';
import * as reviewTheoryQuestionRepository from '../repositories/reviewTheoryQuestionRepository.js';
import type { Review } from '../types/index.js';

export async function createReview(candidateId: string): Promise<Review> {
  const candidate = await candidateRepository.findById(candidateId);

  if (!candidate) {
    throw new Error(`Candidate with id "${candidateId}" not found.`);
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

  const correctCount = questions.filter((q) => q.result === 'correct').length;
  const theoryScore  = parseFloat(((correctCount / questions.length) * 100).toFixed(2));

  const finalized = await reviewRepository.updateFinalizedReview(reviewId, theoryScore);
  if (!finalized) {
    throw new Error('Review not found.');
  }

  return finalized;
}
