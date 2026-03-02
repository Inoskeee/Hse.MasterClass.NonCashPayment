import { v4 as uuid } from 'uuid';
import {
  ApprovalLimit,
  ApprovalTask,
  AuditLog,
  BlacklistEntry,
  BudgetItem,
  Counterparty,
  PaymentRequest,
  StatusReason,
  User
} from '../types/domain';

const now = () => new Date().toISOString();

export const db = {
  users: [
    { id: 'u-init-1', name: 'Иван Инициатор', role: 'INITIATOR' },
    { id: 'u-treas-1', name: 'Тамара Казначей', role: 'TREASURER' },
    { id: 'u-cfo-1', name: 'Фёдор CFO', role: 'CFO' },
    { id: 'u-admin-1', name: 'Анна Админ', role: 'ADMIN' }
  ] as User[],
  credentials: new Map<string, { password: string; userId: string }>([
    ['initiator', { password: 'initiator123', userId: 'u-init-1' }],
    ['treasurer', { password: 'treasury123', userId: 'u-treas-1' }],
    ['cfo', { password: 'cfo123', userId: 'u-cfo-1' }],
    ['admin', { password: 'admin123', userId: 'u-admin-1' }]
  ]),
  tokens: new Map<string, string>(),
  counterparties: [
    { id: 'cp-1', name: 'ООО Альфа', inn: '7701001001', iban: 'RU10000000000000000001', bik: '044525225', bankName: 'Сбербанк', email: 'alpha@test.ru' },
    { id: 'cp-2', name: 'ООО Бета', inn: '7701001002', email: 'beta@test.ru' },
    { id: 'cp-3', name: 'ООО Риск', inn: '7701001003', iban: 'RU10000000000000000003', bik: '044525593', bankName: 'ВТБ', email: 'risk@test.ru' }
  ] as Counterparty[],
  budgetItems: [
    { id: 'bi-1', code: '100', name: 'Операционные расходы' },
    { id: 'bi-2', code: '200', name: 'Капзатраты' },
    { id: 'bi-3', code: '300', name: 'Маркетинг' },
    { id: 'bi-4', code: '400', name: 'Логистика' },
    { id: 'bi-5', code: '500', name: 'IT услуги' }
  ] as BudgetItem[],
  blacklist: [
    { id: 'bl-1', counterpartyId: 'cp-3', reason: 'Санкционный риск', createdAt: now() }
  ] as BlacklistEntry[],
  limits: [
    { id: 'lim-1', scopeType: 'GLOBAL', currency: 'RUB', limitAmount: 50000 },
    { id: 'lim-2', scopeType: 'BY_BUDGET_ITEM', scopeId: 'bi-2', currency: 'RUB', limitAmount: 10000 },
    { id: 'lim-3', scopeType: 'BY_INITIATOR', scopeId: 'u-init-1', currency: 'RUB', limitAmount: 30000 }
  ] as ApprovalLimit[],
  payments: [] as PaymentRequest[],
  approvals: [] as ApprovalTask[],
  auditLogs: [] as AuditLog[],
  statusReasons: [] as StatusReason[]
};

export function newId(prefix: string) {
  return `${prefix}-${uuid().slice(0, 8)}`;
}
