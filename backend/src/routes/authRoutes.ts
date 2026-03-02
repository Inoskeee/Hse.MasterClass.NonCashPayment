import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../services/inMemoryStore';

export const authRoutes = Router();

authRoutes.get('/users', (_req, res) => {
  res.json(db.users);
});

authRoutes.post('/login', (req, res) => {
  const { userId, login, password } = req.body as { userId?: string; login?: string; password?: string };

  let resolvedUserId = userId;
  if (login && password) {
    const credentials = db.credentials.get(login.trim().toLowerCase());
    if (!credentials || credentials.password !== password) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Неверный логин или пароль' } });
    }
    resolvedUserId = credentials.userId;
  }

  const user = db.users.find((u) => u.id === resolvedUserId);
  if (!user) return res.status(400).json({ error: { code: 'INVALID_USER', message: 'User not found' } });
  const token = uuid();
  db.tokens.set(token, user.id);
  res.json({ token, user });
});
