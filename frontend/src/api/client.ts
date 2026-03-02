import { mockApi } from './mockApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

function getToken() {
  return localStorage.getItem('token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (DEMO_MODE) return mockApi<T>(path, options);

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(body?.error?.message || 'API Error');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
