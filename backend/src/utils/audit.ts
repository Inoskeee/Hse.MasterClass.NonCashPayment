import { db, newId } from '../services/inMemoryStore';

export function addAudit(entityType: 'PAYMENT' | 'DIRECTORY', entityId: string, action: string, actorId: string, payload: unknown) {
  db.auditLogs.push({ id: newId('audit'), entityType, entityId, action, actorId, payload, createdAt: new Date().toISOString() });
}
