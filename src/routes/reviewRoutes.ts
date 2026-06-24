import { Router } from 'express';
import {
  createReview,
  getReview,
  finalizeReview,
  updateReviewFeedback,
} from '../controllers/reviewController.js';

const router = Router();

router.post('/', createReview);
router.get('/:id', getReview);
router.patch('/:id/finalize', finalizeReview);
router.patch('/:id/feedback', updateReviewFeedback);

export default router;
