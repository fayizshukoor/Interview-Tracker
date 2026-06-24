import express from 'express';
import candidateRoutes from './routes/candidateRoutes.js';

const app = express();

app.use(express.json());

app.use('/candidates', candidateRoutes);

export default app;