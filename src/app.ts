import express from 'express';
import cors from 'cors';

import candidateRoutes from './routes/candidateRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import practicalQuestionRoutes from './routes/practicalQuestionRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import reviewTheoryQuestionRoutes from './routes/reviewTheoryQuestionRoutes.js';
import reviewPendingTopicRoutes from './routes/reviewPendingTopicRoutes.js';
import reviewPracticalTaskRoutes from './routes/reviewPracticalTaskRoutes.js';
import authRoutes from './routes/authRoutes.js';
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
