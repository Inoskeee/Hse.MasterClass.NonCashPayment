import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { db } from '../services/inMemoryStore';

export const reportRoutes = Router();

reportRoutes.get('/queue', requireRole('TREASURER'), (_req, res) => {
  res.json(db.payments.filter((p) => ['SUBMITTED', 'TREASURY_CHECK', 'NEEDS_APPROVAL'].includes(p.status)));
});

reportRoutes.get('/quality', requireRole('TREASURER', 'ADMIN'), (_req, res) => {
  const agg = db.statusReasons
    .filter((r) => r.type === 'RETURN')
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.message] = (acc[item.message] || 0) + 1;
      return acc;
    }, {});
  res.json(Object.entries(agg).map(([message, count]) => ({ message, count })).sort((a, b) => b.count - a.count));
});

reportRoutes.get('/sla', requireRole('TREASURER', 'ADMIN'), (_req, res) => {
  const values = db.payments
    .map((payment) => {
      const submitted = db.auditLogs.find((a) => a.entityId === payment.id && a.action === 'SUBMITTED');
      const approved = db.auditLogs.find((a) => a.entityId === payment.id && a.action === 'CFO_APPROVED') || (payment.status === 'APPROVED' ? { createdAt: payment.updatedAt } : undefined);
      if (!submitted || !approved) return null;
      return new Date(approved.createdAt).getTime() - new Date(submitted.createdAt).getTime();
    })
    .filter((v): v is number => v !== null);

  const avgMs = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  res.json({ averageMs: avgMs, averageMinutes: Math.round(avgMs / 600) / 100, samples: values.length });
});
