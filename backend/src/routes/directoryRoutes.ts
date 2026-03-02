import { Router } from 'express';
import { requireRole, AuthedRequest } from '../middleware/auth';
import { db, newId } from '../services/inMemoryStore';
import { addAudit } from '../utils/audit';

export const directoryRoutes = Router();

function crud<T extends { id: string }>(path: string, collection: T[]) {
  directoryRoutes.get(path, (_req, res) => res.json(collection));
  directoryRoutes.post(path, requireRole('ADMIN'), (req: AuthedRequest, res) => {
    const item = { id: newId(path.replace(/\//g, '') || 'dir'), ...req.body } as T;
    collection.push(item);
    addAudit('DIRECTORY', item.id, `CREATE_${path}`, req.user!.id, item);
    res.status(201).json(item);
  });
  directoryRoutes.put(`${path}/:id`, requireRole('ADMIN'), (req: AuthedRequest, res) => {
    const idx = collection.findIndex((i) => i.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    collection[idx] = { ...collection[idx], ...req.body };
    addAudit('DIRECTORY', req.params.id, `UPDATE_${path}`, req.user!.id, collection[idx]);
    res.json(collection[idx]);
  });
  directoryRoutes.delete(`${path}/:id`, requireRole('ADMIN'), (req: AuthedRequest, res) => {
    const idx = collection.findIndex((i) => i.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    const [removed] = collection.splice(idx, 1);
    addAudit('DIRECTORY', req.params.id, `DELETE_${path}`, req.user!.id, removed);
    res.status(204).send();
  });
}

crud('/counterparties', db.counterparties);
crud('/budget-items', db.budgetItems);
crud('/blacklist', db.blacklist);
crud('/limits', db.limits);
