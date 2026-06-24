import { Router } from 'express';
import {
  addQuestionsToReview,
  getQuestionsForReview,
  markQuestionResult,
  addRandomQuestionsToReview,
} from '../controllers/reviewTheoryQuestionController.js';

const router = Router();

router.post('/reviews/:reviewId/questions/random', addRandomQuestionsToReview);
router.post('/reviews/:reviewId/questions', addQuestionsToReview);
router.get('/reviews/:reviewId/questions', getQuestionsForReview);
router.patch('/review-questions/:id/result', markQuestionResult);

export default router;
