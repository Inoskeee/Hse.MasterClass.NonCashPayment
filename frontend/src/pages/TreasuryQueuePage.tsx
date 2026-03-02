import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Payment } from '../types';
import { Modal } from '../components/Modal';

export function TreasuryQueuePage() {
  const [items, setItems] = useState<Payment[]>([]); const [modalId, setModalId] = useState<string|undefined>(); const [message, setMessage] = useState('');
  const load = () => api<Payment[]>('/api/reports/queue').then(setItems).catch((e)=>alert(e.message));
  useEffect(() => { void load(); }, []);
  const action = async (id: string, endpoint: string, body?: any) => { await api(`/api/payments/${id}/${endpoint}`, { method:'POST', body: body?JSON.stringify(body):undefined }); load(); };
  return <div><h2>Очередь казначейства</h2><table><thead><tr><th>ID</th><th>Статус</th><th>Действия</th></tr></thead><tbody>{items.map(p=><tr key={p.id}><td>{p.id}</td><td>{p.status}</td><td><button onClick={()=>action(p.id,'treasury-take')}>Взять</button><button onClick={()=>setModalId(p.id)}>Вернуть</button><button onClick={()=>action(p.id,'auto-check')}>Auto-check</button><button onClick={()=>action(p.id,'send-to-bank')}>В банк</button></td></tr>)}</tbody></table>
  {modalId && <Modal title='Причина возврата' onClose={()=>setModalId(undefined)} onSubmit={()=>{action(modalId,'return',{message});setModalId(undefined);}}><textarea value={message} onChange={(e)=>setMessage(e.target.value)} /></Modal>}</div>;
}
