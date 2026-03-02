import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Payment } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export function MyPaymentsPage() {
  const [status, setStatus] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const load = () => api<Payment[]>(`/api/payments?mine=true${status ? `&status=${status}` : ''}`).then(setPayments).catch((e)=>alert(e.message));
  useEffect(() => { void load(); }, [status]);
  return <div><h2>Мои платежи</h2><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value=''>Все</option><option>DRAFT</option><option>NEEDS_FIX</option><option>SUBMITTED</option></select>
  <table><thead><tr><th>ID</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td><Link to={`/payments/${p.id}`}>{p.id}</Link></td><td>{p.amount} {p.currency}</td><td><StatusBadge status={p.status} /></td></tr>)}</tbody></table></div>;
}
