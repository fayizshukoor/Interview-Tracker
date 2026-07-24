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

const app = express();

// Expose X-Total-Count so the frontend can read pagination totals from responses
app.use(cors({ origin: 'http://localhost:5173', exposedHeaders: ['X-Total-Count'] }));
app.use(express.json());

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

export default app;