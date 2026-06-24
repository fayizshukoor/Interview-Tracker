import * as reviewRepository from '../repositories/reviewRepository.js';
import * as candidateRepository from '../repositories/candidateRepository.js';
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
