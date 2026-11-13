import { Router } from 'express';
import { createCandidate, getAllCandidates, getCandidate } from './candidate.controller.js';

const router = Router();

router.post('/', createCandidate);
router.get('/', getAllCandidates);
router.get('/:id', getCandidate);

export default router;
