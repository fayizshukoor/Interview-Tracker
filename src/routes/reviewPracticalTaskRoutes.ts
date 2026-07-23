import { Router } from 'express';
import {
  addPracticalTask,
  getPracticalTasks,
  scorePracticalTask,
  deletePracticalTask,
  startPracticalTask,
  stopPracticalTask,
} from '../controllers/reviewPracticalTaskController.js';

const router = Router();

// All task operations are scoped to a review
router.post('/reviews/:reviewId/practical-tasks', addPracticalTask);
router.get('/reviews/:reviewId/practical-tasks', getPracticalTasks);

// Score and delete use the task id directly
router.patch('/practical-tasks/:taskId/score', scorePracticalTask);
router.delete('/practical-tasks/:taskId', deletePracticalTask);
router.patch('/practical-tasks/:taskId/start', startPracticalTask);
router.patch('/practical-tasks/:taskId/stop', stopPracticalTask);

export default router;
