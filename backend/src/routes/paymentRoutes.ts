import { Router } from 'express';
import { AuthedRequest, requireRole } from '../middleware/auth';
import { db, newId } from '../services/inMemoryStore';
import { ensureApprovalTask, runRules } from '../services/rulesEngine';
import { addAudit } from '../utils/audit';
import { PaymentRequest, PaymentStatus } from '../types/domain';

export const paymentRoutes = Router();

const editableByInitiator: PaymentStatus[] = ['DRAFT', 'NEEDS_FIX'];

function findPayment(id: string, res: any) {
  const payment = db.payments.find((p) => p.id === id);
  if (!payment) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return null;
  }
  return payment;
}

paymentRoutes.post('/', requireRole('INITIATOR'), (req: AuthedRequest, res) => {
  const now = new Date().toISOString();
  const payment: PaymentRequest = {
    id: newId('pay'),
    initiatorId: req.user!.id,
    createdAt: now,
    updatedAt: now,
    status: 'DRAFT',
    amount: req.body.amount ?? 0,
    currency: req.body.currency ?? 'RUB',
    purpose: req.body.purpose ?? '',
    counterpartyId: req.body.counterpartyId ?? '',
    budgetItemId: req.body.budgetItemId ?? '',
    contractRef: req.body.contractRef,
    plannedPaymentDate: req.body.plannedPaymentDate,
    urgency: req.body.urgency ?? 'NORMAL',
    attachments: [],
    bankDetailsSnapshot: {},
    validationFlags: { missingFields: [], riskyCounterparty: false, overLimit: false, duplicateSuspected: false },
    bankStatus: 'NOT_SENT'
  };
  db.payments.push(payment);
  addAudit('PAYMENT', payment.id, 'PAYMENT_CREATED', req.user!.id, payment);
  res.status(201).json(payment);
});

paymentRoutes.get('/', (req: AuthedRequest, res) => {
  let list = [...db.payments];
  const { mine, status, dateFrom, dateTo, urgency, budgetItemId } = req.query;
  if (mine === 'true') list = list.filter((p) => p.initiatorId === req.user!.id);
  if (status) list = list.filter((p) => p.status === status);
  if (urgency) list = list.filter((p) => p.urgency === urgency);
  if (budgetItemId) list = list.filter((p) => p.budgetItemId === budgetItemId);
  if (dateFrom) list = list.filter((p) => new Date(p.createdAt) >= new Date(String(dateFrom)));
  if (dateTo) list = list.filter((p) => new Date(p.createdAt) <= new Date(String(dateTo)));
  res.json(list);
});

paymentRoutes.get('/:id', (req, res) => {
  const payment = findPayment(req.params.id, res);
  if (payment) res.json(payment);
});

paymentRoutes.put('/:id', (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;

  if (req.user!.role === 'INITIATOR') {
    if (payment.initiatorId !== req.user!.id || !editableByInitiator.includes(payment.status)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cannot edit payment in this status' } });
    }
    Object.assign(payment, req.body);
  } else if (req.user!.role === 'TREASURER') {
    const allowed = ['purpose', 'plannedPaymentDate', 'urgency', 'contractRef'];
    allowed.forEach((field) => {
      if (field in req.body) (payment as any)[field] = req.body[field];
    });
  } else {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Role cannot edit payment' } });
  }

  payment.updatedAt = new Date().toISOString();
  addAudit('PAYMENT', payment.id, 'PAYMENT_UPDATED', req.user!.id, req.body);
  res.json(payment);
});

paymentRoutes.post('/:id/submit', requireRole('INITIATOR'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  if (payment.initiatorId !== req.user!.id) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not owner' } });
  payment.status = 'SUBMITTED';
  payment.updatedAt = new Date().toISOString();
  addAudit('PAYMENT', payment.id, 'SUBMITTED', req.user!.id, {});
  res.json(payment);
});

paymentRoutes.post('/:id/treasury-take', requireRole('TREASURER'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.status = 'TREASURY_CHECK';
  payment.updatedAt = new Date().toISOString();
  addAudit('PAYMENT', payment.id, 'TREASURY_TAKE', req.user!.id, {});
  res.json(payment);
});

paymentRoutes.post('/:id/return', requireRole('TREASURER'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.status = 'NEEDS_FIX';
  payment.updatedAt = new Date().toISOString();
  db.statusReasons.push({ id: newId('reason'), paymentId: payment.id, type: 'RETURN', message: req.body.message || 'Нужна доработка', createdAt: payment.updatedAt, actorId: req.user!.id });
  addAudit('PAYMENT', payment.id, 'RETURNED_FOR_FIX', req.user!.id, req.body);
  res.json(payment);
});

paymentRoutes.post('/:id/auto-check', requireRole('TREASURER'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.status = 'AUTO_CHECKING';
  const result = runRules(payment);
  payment.validationFlags = result.flags;
  payment.status = result.recommendedNextStatus;
  payment.updatedAt = new Date().toISOString();

  if (payment.status === 'NEEDS_APPROVAL') ensureApprovalTask(payment.id);
  if (payment.status === 'NEEDS_FIX' && result.reason) {
    db.statusReasons.push({ id: newId('reason'), paymentId: payment.id, type: 'RETURN', message: result.reason, createdAt: payment.updatedAt, actorId: req.user!.id });
  }
  addAudit('PAYMENT', payment.id, 'AUTO_CHECK_EXECUTED', req.user!.id, result);
  res.json(payment);
});

paymentRoutes.post('/:id/approve', requireRole('CFO'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.status = 'APPROVED';
  payment.updatedAt = new Date().toISOString();
  const task = db.approvals.find((a) => a.paymentId === payment.id && a.decision === 'PENDING');
  if (task) {
    task.decision = 'APPROVED';
    task.comment = req.body.comment;
    task.decidedAt = payment.updatedAt;
  }
  addAudit('PAYMENT', payment.id, 'CFO_APPROVED', req.user!.id, req.body);
  res.json(payment);
});

paymentRoutes.post('/:id/reject', requireRole('CFO'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.status = 'REJECTED';
  payment.updatedAt = new Date().toISOString();
  db.statusReasons.push({ id: newId('reason'), paymentId: payment.id, type: 'REJECT', message: req.body.reason || 'Отклонено CFO', createdAt: payment.updatedAt, actorId: req.user!.id });
  const task = db.approvals.find((a) => a.paymentId === payment.id && a.decision === 'PENDING');
  if (task) {
    task.decision = 'REJECTED';
    task.comment = req.body.reason;
    task.decidedAt = payment.updatedAt;
  }
  addAudit('PAYMENT', payment.id, 'CFO_REJECTED', req.user!.id, req.body);
  res.json(payment);
});

paymentRoutes.post('/:id/send-to-bank', requireRole('TREASURER'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.status = 'SENDING_TO_BANK';
  payment.bankStatus = 'SENT';
  payment.updatedAt = new Date().toISOString();
  payment.status = 'SENT_TO_BANK';
  addAudit('PAYMENT', payment.id, 'SENT_TO_BANK', req.user!.id, {});
  res.json(payment);
});

paymentRoutes.post('/:id/bank-callback', requireRole('TREASURER', 'ADMIN'), (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  const { bankStatus, comment } = req.body as { bankStatus: 'ACCEPTED' | 'REJECTED'; comment?: string };
  payment.bankStatus = bankStatus;
  payment.bankStatusComment = comment;
  payment.status = bankStatus === 'ACCEPTED' ? 'BANK_ACCEPTED' : 'BANK_REJECTED';
  payment.updatedAt = new Date().toISOString();
  addAudit('PAYMENT', payment.id, 'BANK_CALLBACK', req.user!.id, req.body);
  res.json(payment);
});

paymentRoutes.post('/:id/attachments', (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  const attachment = {
    id: newId('att'),
    paymentId: payment.id,
    name: req.body.name,
    type: req.body.type,
    uploadedAt: new Date().toISOString(),
    urlMock: `mock://${req.body.name}`
  };
  payment.attachments.push(attachment as any);
  payment.updatedAt = new Date().toISOString();
  addAudit('PAYMENT', payment.id, 'ATTACHMENT_ADDED', req.user!.id, attachment);
  res.status(201).json(attachment);
});

paymentRoutes.delete('/:id/attachments/:attId', (req: AuthedRequest, res) => {
  const payment = findPayment(req.params.id, res);
  if (!payment) return;
  payment.attachments = payment.attachments.filter((a) => a.id !== req.params.attId);
  payment.updatedAt = new Date().toISOString();
  addAudit('PAYMENT', payment.id, 'ATTACHMENT_REMOVED', req.user!.id, req.params.attId);
  res.status(204).send();
});

paymentRoutes.get('/:id/audit', (_req, res) => {
  const paymentId = _req.params.id;
  res.json({
    logs: db.auditLogs.filter((a) => a.entityType === 'PAYMENT' && a.entityId === paymentId),
    reasons: db.statusReasons.filter((s) => s.paymentId === paymentId)
  });
});
