import { Router } from 'express';
import {
  addQuestionsToReview,
  getQuestionsForReview,
  markQuestionResult,
  addRandomQuestionsToReview,
  reorderReviewQuestions,
} from '../controllers/reviewTheoryQuestionController.js';

const router = Router();

router.post('/reviews/:reviewId/questions/random', addRandomQuestionsToReview);
router.post('/reviews/:reviewId/questions', addQuestionsToReview);
router.get('/reviews/:reviewId/questions', getQuestionsForReview);
router.patch('/reviews/:reviewId/questions/order', reorderReviewQuestions);
router.patch('/review-questions/:id/result', markQuestionResult);

export default router;
