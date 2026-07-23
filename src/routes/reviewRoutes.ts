import { Router } from 'express';
import {
  listReviews,
  createReview,
  getReview,
  finalizeReview,
  updateReviewFeedback,
  deleteReview,
} from '../controllers/reviewController.js';

const router = Router();

router.get('/', listReviews);
router.post('/', createReview);
router.get('/:id', getReview);
router.patch('/:id/finalize', finalizeReview);
router.patch('/:id/feedback', updateReviewFeedback);
router.delete('/:id', deleteReview);

export default router;
