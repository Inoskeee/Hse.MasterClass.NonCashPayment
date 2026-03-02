export type Role = 'INITIATOR' | 'TREASURER' | 'CFO' | 'ADMIN';
export type Currency = 'RUB' | 'EUR' | 'USD';
export type ScopeType = 'BY_INITIATOR' | 'BY_BUDGET_ITEM' | 'GLOBAL';
export type Urgency = 'NORMAL' | 'URGENT';

export type PaymentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TREASURY_CHECK'
  | 'NEEDS_FIX'
  | 'AUTO_CHECKING'
  | 'NEEDS_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENDING_TO_BANK'
  | 'SENT_TO_BANK'
  | 'BANK_ACCEPTED'
  | 'BANK_REJECTED';

export interface User { id: string; name: string; role: Role }
export interface Counterparty {
  id: string;
  name: string;
  inn?: string;
  iban?: string;
  bik?: string;
  bankName?: string;
  email?: string;
}
export interface BudgetItem { id: string; code: string; name: string }
export interface BlacklistEntry { id: string; counterpartyId: string; reason: string; createdAt: string }
export interface ApprovalLimit {
  id: string;
  scopeType: ScopeType;
  scopeId?: string;
  currency: Currency;
  limitAmount: number;
}
export interface BankTemplate { id: string; name: string; requiredFields: string[]; version: string }

export interface Attachment {
  id: string;
  paymentId: string;
  name: string;
  type: 'INVOICE' | 'CONTRACT' | 'ACT' | 'OTHER';
  uploadedAt: string;
  urlMock?: string;
}

export interface ValidationFlags {
  missingFields: string[];
  riskyCounterparty: boolean;
  overLimit: boolean;
  duplicateSuspected: boolean;
}

export interface PaymentRequest {
  id: string;
  initiatorId: string;
  createdAt: string;
  updatedAt: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  purpose: string;
  counterpartyId: string;
  budgetItemId: string;
  contractRef?: string;
  plannedPaymentDate?: string;
  urgency: Urgency;
  attachments: Attachment[];
  bankDetailsSnapshot: {
    iban?: string;
    bik?: string;
    bankName?: string;
    beneficiaryName?: string;
  };
  validationFlags: ValidationFlags;
  bankStatus?: 'NOT_SENT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  bankStatusComment?: string;
}

export interface ApprovalTask {
  id: string;
  paymentId: string;
  assignedToUserId: string;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  decidedAt?: string;
}

export interface AuditLog {
  id: string;
  entityType: 'PAYMENT' | 'DIRECTORY';
  entityId: string;
  action: string;
  actorId: string;
  payload: unknown;
  createdAt: string;
}

export interface StatusReason {
  id: string;
  paymentId: string;
  type: 'RETURN' | 'REJECT';
  message: string;
  createdAt: string;
  actorId: string;
}
