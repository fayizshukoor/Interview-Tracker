import { Router } from 'express';
import { createReview, getReview } from '../controllers/reviewController.js';

const router = Router();

router.post('/', createReview);
router.get('/:id', getReview);

export default router;
