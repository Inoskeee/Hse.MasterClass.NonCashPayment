import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/authRoutes';
import { directoryRoutes } from './routes/directoryRoutes';
import { paymentRoutes } from './routes/paymentRoutes';
import { approvalRoutes } from './routes/approvalRoutes';
import { reportRoutes } from './routes/reportRoutes';
import { authRequired } from './middleware/auth';
import { errorHandler, notFound } from './middleware/error';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (_req, res) => {
  res.json({
    service: 'non-cash-payment-backend',
    status: 'ok',
    docs: '/api/auth/users'
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', authRequired);
app.use('/api', directoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
