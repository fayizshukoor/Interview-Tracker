import express from 'express';
import cors from 'cors';

import candidateRoutes from './routes/candidateRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import reviewTheoryQuestionRoutes from './routes/reviewTheoryQuestionRoutes.js';
import reviewPendingTopicRoutes from './routes/reviewPendingTopicRoutes.js';
import reviewPracticalTaskRoutes from './routes/reviewPracticalTaskRoutes.js';

const app = express();

app.use(cors({
    origin : 'http://localhost:5173'
}));

app.use(express.json());

app.use('/candidates', candidateRoutes);
app.use('/questions', questionRoutes);
app.use('/reviews', reviewRoutes);
app.use('/', reviewTheoryQuestionRoutes);
app.use('/', reviewPendingTopicRoutes);
app.use('/', reviewPracticalTaskRoutes);

export default app;