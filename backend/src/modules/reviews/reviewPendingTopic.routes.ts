import { Router } from 'express';
import { getPendingTopicsForReview } from './reviewPendingTopic.controller.js';

const router = Router();

router.get('/reviews/:reviewId/pending-topics', getPendingTopicsForReview);

export default router;
