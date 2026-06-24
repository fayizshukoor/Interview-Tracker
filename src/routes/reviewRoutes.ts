import { Router } from 'express';
import { createReview, getReview, finalizeReview } from '../controllers/reviewController.js';

const router = Router();

router.post('/', createReview);
router.get('/:id', getReview);
router.patch('/:id/finalize', finalizeReview);

export default router;
