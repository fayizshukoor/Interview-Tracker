import express from 'express';
import candidateRoutes from './routes/candidateRoutes.js';
import questionRoutes from './routes/questionRoutes.js';

const app = express();

app.use(express.json());

app.use('/candidates', candidateRoutes);
app.use('/questions', questionRoutes);

export default app;