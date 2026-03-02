import { db, newId } from './inMemoryStore';
import { ApprovalTask, PaymentRequest, PaymentStatus, ValidationFlags } from '../types/domain';

const DUPLICATE_WINDOW_MS = 60 * 60 * 1000;

export function runRules(payment: PaymentRequest): { flags: ValidationFlags; recommendedNextStatus: PaymentStatus; reason?: string } {
  const missingFields: string[] = [];
  if (!payment.counterpartyId) missingFields.push('counterpartyId');
  if (!payment.amount || payment.amount <= 0) missingFields.push('amount');
  if (!payment.currency) missingFields.push('currency');
  if (!payment.purpose) missingFields.push('purpose');
  if (!payment.budgetItemId) missingFields.push('budgetItemId');

  const counterparty = db.counterparties.find((c) => c.id === payment.counterpartyId);
  if (!counterparty?.iban) missingFields.push('counterparty.iban');
  if (!counterparty?.bik) missingFields.push('counterparty.bik');

  const hasDoc = payment.attachments.some((a) => a.type === 'INVOICE' || a.type === 'CONTRACT');
  if (!hasDoc) missingFields.push('attachments.INVOICE_OR_CONTRACT');

  const riskyCounterparty = db.blacklist.some((b) => b.counterpartyId === payment.counterpartyId);

  const limit =
    db.limits.find((l) => l.scopeType === 'BY_INITIATOR' && l.scopeId === payment.initiatorId && l.currency === payment.currency) ??
    db.limits.find((l) => l.scopeType === 'BY_BUDGET_ITEM' && l.scopeId === payment.budgetItemId && l.currency === payment.currency) ??
    db.limits.find((l) => l.scopeType === 'GLOBAL' && l.currency === payment.currency);

  const overLimit = Boolean(limit && payment.amount > limit.limitAmount);

  const duplicateSuspected = db.payments.some((p) => {
    if (p.id === payment.id || p.status === 'REJECTED') return false;
    const createdDiff = Math.abs(new Date(payment.createdAt).getTime() - new Date(p.createdAt).getTime());
    return createdDiff <= DUPLICATE_WINDOW_MS && p.initiatorId === payment.initiatorId && p.counterpartyId === payment.counterpartyId && p.amount === payment.amount && p.currency === payment.currency;
  });

  const flags: ValidationFlags = { missingFields, riskyCounterparty, overLimit, duplicateSuspected };

  if (missingFields.length) return { flags, recommendedNextStatus: 'NEEDS_FIX', reason: 'Не заполнены обязательные поля/реквизиты' };
  if (riskyCounterparty || overLimit || duplicateSuspected) return { flags, recommendedNextStatus: 'NEEDS_APPROVAL' };
  return { flags, recommendedNextStatus: 'APPROVED' };
}

export function ensureApprovalTask(paymentId: string): ApprovalTask | undefined {
  const cfo = db.users.find((u) => u.role === 'CFO');
  if (!cfo) return undefined;
  let task = db.approvals.find((a) => a.paymentId === paymentId && a.decision === 'PENDING');
  if (!task) {
    task = { id: newId('appr'), paymentId, assignedToUserId: cfo.id, decision: 'PENDING' };
    db.approvals.push(task);
  }
  return task;
}
