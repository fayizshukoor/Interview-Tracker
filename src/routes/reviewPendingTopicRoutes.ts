import { Router } from 'express';
import { getPendingTopicsForReview } from '../controllers/reviewPendingTopicController.js';

const router = Router();

router.get('/reviews/:reviewId/pending-topics', getPendingTopicsForReview);

export default router;
