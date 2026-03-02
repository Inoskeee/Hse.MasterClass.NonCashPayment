import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { BudgetItem, Counterparty, Payment } from '../types';

export function CreatePaymentPage() {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [form, setForm] = useState<any>({ amount: 0, currency: 'RUB', purpose: '', counterpartyId: '', budgetItemId: '', urgency: 'NORMAL' });
  const [attName, setAttName] = useState(''); const [attType, setAttType] = useState('INVOICE');

  useEffect(() => {
    Promise.all([api<Counterparty[]>('/api/counterparties'), api<BudgetItem[]>('/api/budget-items')]).then(([c,b])=>{setCounterparties(c);setBudgetItems(b);}).catch((e)=>alert(e.message));
  }, []);

  const create = async () => { const p = await api<Payment>('/api/payments', { method: 'POST', body: JSON.stringify(form) }); setPayment(p); alert('Черновик создан'); };
  const addAtt = async () => { if (!payment) return; await api(`/api/payments/${payment.id}/attachments`, { method: 'POST', body: JSON.stringify({ name: attName, type: attType }) }); setPayment(await api(`/api/payments/${payment.id}`)); };
  const submit = async () => { if (!payment) return; await api(`/api/payments/${payment.id}/submit`, { method: 'POST' }); alert('Отправлено'); };

  return <div><h2>Создать платеж</h2><div className='form'>{['amount','purpose'].map((f)=><input key={f} placeholder={f} value={form[f]} onChange={(e)=>setForm({...form,[f]:f==='amount'?Number(e.target.value):e.target.value})} />)}
  <select value={form.currency} onChange={(e)=>setForm({...form,currency:e.target.value})}><option>RUB</option><option>USD</option><option>EUR</option></select>
  <select value={form.counterpartyId} onChange={(e)=>setForm({...form,counterpartyId:e.target.value})}><option value=''>Контрагент</option>{counterparties.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
  <select value={form.budgetItemId} onChange={(e)=>setForm({...form,budgetItemId:e.target.value})}><option value=''>Статья</option>{budgetItems.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
  <button onClick={create}>Создать черновик</button></div>
  {payment && <div><h3>Вложения</h3><input value={attName} onChange={(e)=>setAttName(e.target.value)} placeholder='Название' /><select value={attType} onChange={(e)=>setAttType(e.target.value)}><option>INVOICE</option><option>CONTRACT</option><option>ACT</option><option>OTHER</option></select><button onClick={addAtt}>Добавить</button><ul>{payment.attachments.map(a=><li key={a.id}>{a.name} ({a.type})</li>)}</ul><button onClick={submit}>Submit</button></div>}
  </div>;
}
