import express from 'express';
import cors from 'cors';

import candidateRoutes from './modules/candidates/candidate.routes.js';
import questionRoutes from './modules/questions/question.routes.js';
import practicalQuestionRoutes from './modules/questions/practicalQuestion.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import reviewTheoryQuestionRoutes from './modules/reviews/reviewTheoryQuestion.routes.js';
import reviewPendingTopicRoutes from './modules/reviews/reviewPendingTopic.routes.js';
import reviewPracticalTaskRoutes from './modules/reviews/reviewPracticalTask.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { authenticate } from './middleware/authenticate.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './config/db.js';

const app = express();

// Expose X-Total-Count so the frontend can read pagination totals from responses
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  exposedHeaders: ['X-Total-Count'],
}));
app.use(express.json());
app.use(requestLogger);

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ api: 'ok', database: 'connected' });
  } catch (error) {
    console.error('[health] Database check failed:', error);
    res.status(503).json({ api: 'ok', database: 'disconnected' });
  }
});

// Public auth routes
app.use('/auth', authRoutes);

// Protect all subsequent routes with JWT authentication
app.use(authenticate);

app.use('/candidates', candidateRoutes);
app.use('/questions', questionRoutes);
app.use('/practical-questions', practicalQuestionRoutes);
app.use('/reviews', reviewRoutes);
app.use('/', reviewTheoryQuestionRoutes);
app.use('/', reviewPendingTopicRoutes);
app.use('/', reviewPracticalTaskRoutes);

app.use(errorHandler);

export default app;
