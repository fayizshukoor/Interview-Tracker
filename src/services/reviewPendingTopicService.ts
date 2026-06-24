import * as reviewPendingTopicRepository from '../repositories/reviewPendingTopicRepository.js';
import * as reviewRepository from '../repositories/reviewRepository.js';
import type { ReviewPendingTopic } from '../types/index.js';

export async function getPendingTopicsForReview(reviewId: string): Promise<ReviewPendingTopic[]> {
  const review = await reviewRepository.findById(reviewId);

  if (!review) {
    throw new Error(`Review with id "${reviewId}" not found.`);
  }

  return reviewPendingTopicRepository.findByReviewId(reviewId);
}
