import { BudgetItem, Counterparty, Payment, User } from '../types';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const users: User[] = [
  { id: 'u-init-1', name: 'Иван Инициатор', role: 'INITIATOR' },
  { id: 'u-treas-1', name: 'Тамара Казначей', role: 'TREASURER' },
  { id: 'u-cfo-1', name: 'Фёдор CFO', role: 'CFO' },
  { id: 'u-admin-1', name: 'Анна Админ', role: 'ADMIN' }
];

const counterparties: Counterparty[] = [
  { id: 'cp-1', name: 'ООО Альфа', iban: 'RU100000000000000001', bik: '044525225', bankName: 'Сбербанк' },
  { id: 'cp-2', name: 'АО ТехПром', iban: 'RU100000000000000002', bik: '044525593', bankName: 'ВТБ' }
];

const budgetItems: BudgetItem[] = [
  { id: 'bi-1', code: '100', name: 'Операционные расходы' },
  { id: 'bi-2', code: '200', name: 'IT услуги' },
  { id: 'bi-3', code: '300', name: 'Маркетинг' }
];

let payments: Payment[] = [
  {
    id: 'pay-demo-1', initiatorId: 'u-init-1', status: 'DRAFT', amount: 120000, currency: 'RUB', purpose: 'Оплата лицензий',
    counterpartyId: 'cp-2', budgetItemId: 'bi-2', urgency: 'NORMAL', createdAt: now(), updatedAt: now(), attachments: [],
    validationFlags: { missingFields: [], riskyCounterparty: false, overLimit: false, duplicateSuspected: false }, bankStatus: 'NOT_SENT'
  },
  {
    id: 'pay-demo-2', initiatorId: 'u-init-1', status: 'SUBMITTED', amount: 86000, currency: 'RUB', purpose: 'Логистика',
    counterpartyId: 'cp-1', budgetItemId: 'bi-1', urgency: 'HIGH', createdAt: now(), updatedAt: now(), attachments: [],
    validationFlags: { missingFields: [], riskyCounterparty: false, overLimit: false, duplicateSuspected: false }, bankStatus: 'NOT_SENT'
  },
  {
    id: 'pay-demo-3', initiatorId: 'u-init-1', status: 'NEEDS_APPROVAL', amount: 540000, currency: 'RUB', purpose: 'Серверное оборудование',
    counterpartyId: 'cp-2', budgetItemId: 'bi-2', urgency: 'HIGH', createdAt: now(), updatedAt: now(), attachments: [],
    validationFlags: { missingFields: [], riskyCounterparty: false, overLimit: true, duplicateSuspected: false }, bankStatus: 'NOT_SENT'
  }
];

const json = <T,>(data: T): T => structuredClone(data);

export async function mockApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase() as ApiMethod;
  const body = options.body ? JSON.parse(String(options.body)) : undefined;

  if (path === '/api/auth/users' && method === 'GET') return json(users) as T;
  if (path === '/api/auth/login' && method === 'POST') {
    const credentials: Record<string, { password: string; userId: string }> = {
      initiator: { password: 'initiator123', userId: 'u-init-1' },
      treasurer: { password: 'treasury123', userId: 'u-treas-1' },
      cfo: { password: 'cfo123', userId: 'u-cfo-1' },
      admin: { password: 'admin123', userId: 'u-admin-1' }
    };

    const pair = credentials[String(body.login || '').trim().toLowerCase()];
    if (!pair || pair.password !== body.password) throw new Error('Неверный логин или пароль');

    const user = users.find((u) => u.id === pair.userId) || users[0];
    return json({ token: `demo-token-${user.id}`, user }) as T;
  }

  if (path.startsWith('/api/payments') && method === 'GET') {
    const query = path.split('?')[1];
    const params = new URLSearchParams(query || '');
    let list = [...payments];
    if (params.get('mine') === 'true') list = list.filter((p) => p.initiatorId === 'u-init-1');
    if (params.get('status')) list = list.filter((p) => p.status === params.get('status'));
    return json(list) as T;
  }
  if (path === '/api/payments' && method === 'POST') {
    const p: Payment = {
      id: id('pay'), initiatorId: 'u-init-1', status: 'DRAFT', amount: body.amount || 0, currency: body.currency || 'RUB',
      purpose: body.purpose || '', counterpartyId: body.counterpartyId || '', budgetItemId: body.budgetItemId || '', urgency: body.urgency || 'NORMAL',
      createdAt: now(), updatedAt: now(), attachments: [], validationFlags: { missingFields: [], riskyCounterparty: false, overLimit: false, duplicateSuspected: false }, bankStatus: 'NOT_SENT'
    };
    payments = [p, ...payments];
    return json(p) as T;
  }

  const paymentMatch = path.match(/^\/api\/payments\/([^/]+)(?:\/(.*))?$/);
  if (paymentMatch) {
    const [, paymentId, action] = paymentMatch;
    const item = payments.find((p) => p.id === paymentId);
    if (!item) throw new Error('Платеж не найден');

    if (!action && method === 'GET') return json(item) as T;
    if (action === 'audit' && method === 'GET') return json({ logs: [{ action: 'PAYMENT_CREATED', createdAt: item.createdAt }], reasons: [] }) as T;
    if (action === 'attachments' && method === 'POST') {
      item.attachments.push({ id: id('att'), name: body.name || 'Файл', type: body.type || 'INVOICE' });
      return json(item.attachments.at(-1)) as T;
    }

    const statusMap: Record<string, string> = {
      submit: 'SUBMITTED', 'treasury-take': 'TREASURY_CHECK', 'auto-check': 'READY_FOR_BANK', 'send-to-bank': 'SENT_TO_BANK', approve: 'APPROVED', reject: 'REJECTED', return: 'NEEDS_FIX'
    };
    if (statusMap[action || ''] && method === 'POST') {
      item.status = statusMap[action || ''];
      item.updatedAt = now();
      return json(item) as T;
    }
  }

  if (path === '/api/reports/queue' && method === 'GET') {
    return json(payments.filter((p) => ['SUBMITTED', 'TREASURY_CHECK', 'NEEDS_APPROVAL'].includes(p.status))) as T;
  }

  if (path === '/api/approvals/pending' && method === 'GET') {
    const rows = payments.filter((p) => p.status === 'NEEDS_APPROVAL').map((payment) => ({ task: { id: id('task') }, payment }));
    return json(rows) as T;
  }

  if (path === '/api/counterparties' && method === 'GET') return json(counterparties) as T;
  if (path === '/api/budget-items' && method === 'GET') return json(budgetItems) as T;
  if (path === '/api/blacklist' && method === 'GET') return json([{ id: 'bl-1', counterpartyId: 'cp-3', reason: 'Санкционные риски', createdAt: now() }]) as T;
  if (path === '/api/limits' && method === 'GET') return json([{ id: 'lim-1', scopeType: 'GLOBAL', currency: 'RUB', limitAmount: 1000000 }]) as T;

  if (path.startsWith('/api/') && method === 'POST') return json({ id: id('row'), ...body }) as T;

  throw new Error(`Mock route not implemented: ${method} ${path}`);
}
