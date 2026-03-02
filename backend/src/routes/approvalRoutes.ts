import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { db } from '../services/inMemoryStore';

export const approvalRoutes = Router();

approvalRoutes.get('/pending', requireRole('CFO'), (_req, res) => {
  const tasks = db.approvals.filter((a) => a.decision === 'PENDING');
  const payments = db.payments.filter((p) => p.status === 'NEEDS_APPROVAL');
  res.json(tasks.map((task) => ({ task, payment: payments.find((p) => p.id === task.paymentId) })));
});
