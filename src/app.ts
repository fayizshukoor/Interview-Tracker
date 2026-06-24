import express from 'express';
import candidateRoutes from './routes/candidateRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import reviewTheoryQuestionRoutes from './routes/reviewTheoryQuestionRoutes.js';

const app = express();

app.use(express.json());

app.use('/candidates', candidateRoutes);
app.use('/questions', questionRoutes);
app.use('/reviews', reviewRoutes);
app.use('/',reviewTheoryQuestionRoutes);

export default app;