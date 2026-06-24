import { Router } from 'express';
import {
  createQuestion,
  getAllQuestions,
  getQuestion,
  getQuestionsByTopic,
  deleteQuestion,
} from '../controllers/questionController.js';

const router = Router();

router.post('/', createQuestion);
router.get('/', getAllQuestions);
router.get('/topic/search', getQuestionsByTopic);
router.get('/:id', getQuestion);
router.delete('/:id', deleteQuestion);

export default router;
