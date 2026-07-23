import { Router } from 'express';
import {
  createQuestion,
  listQuestions,
  getTopics,
  deleteQuestion,
} from '../controllers/practicalQuestionController.js';

const router = Router();

router.post('/',             createQuestion);
router.get('/',              listQuestions);
router.get('/topics',        getTopics);
router.delete('/:id',        deleteQuestion);

export default router;
