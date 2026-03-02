export type Role = 'INITIATOR' | 'TREASURER' | 'CFO' | 'ADMIN';
export interface User { id: string; name: string; role: Role }
export interface Counterparty { id: string; name: string; iban?: string; bik?: string; bankName?: string }
export interface BudgetItem { id: string; code: string; name: string }
export interface ApprovalLimit { id: string; scopeType: string; scopeId?: string; currency: string; limitAmount: number }
export interface BlacklistEntry { id: string; counterpartyId: string; reason: string; createdAt: string }
export interface Payment {
  id: string;
  initiatorId: string;
  status: string;
  amount: number;
  currency: string;
  purpose: string;
  counterpartyId: string;
  budgetItemId: string;
  urgency: string;
  createdAt: string;
  updatedAt: string;
  attachments: { id: string; name: string; type: string }[];
  validationFlags: { missingFields: string[]; riskyCounterparty: boolean; overLimit: boolean; duplicateSuspected: boolean };
  bankStatus?: string;
}
