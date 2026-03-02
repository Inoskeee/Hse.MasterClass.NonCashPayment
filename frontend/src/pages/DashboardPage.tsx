import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Payment } from '../types';

export function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  useEffect(() => { api<Payment[]>('/api/payments').then(setPayments).catch((e)=>alert(e.message)); }, []);
  const count = (s: string) => payments.filter((p) => p.status === s).length;
  return <div><h2>Dashboard</h2><div className='grid'>{['DRAFT','TREASURY_CHECK','NEEDS_APPROVAL','SENT_TO_BANK','REJECTED'].map((s)=><div key={s} className='card'><b>{s}</b><div>{count(s)}</div></div>)}</div></div>;
}
