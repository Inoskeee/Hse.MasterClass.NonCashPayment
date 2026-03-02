import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';

export function CfoQueuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [mode, setMode] = useState<{id:string;type:'approve'|'reject'}|null>(null);
  const [text, setText] = useState('');
  const load = () => api<any[]>('/api/approvals/pending').then(setItems).catch((e)=>alert(e.message));
  useEffect(() => { void load(); }, []);
  const submit = async () => { if(!mode) return; await api(`/api/payments/${mode.id}/${mode.type}`,{method:'POST',body:JSON.stringify(mode.type==='approve'?{comment:text}:{reason:text})}); setMode(null); setText(''); load(); };
  return <div><h2>Очередь CFO</h2>{items.map(i=><div className='card' key={i.task.id}><div>{i.payment?.id} {i.payment?.amount} {i.payment?.currency}</div><button onClick={()=>setMode({id:i.payment.id,type:'approve'})}>Approve</button><button onClick={()=>setMode({id:i.payment.id,type:'reject'})}>Reject</button></div>)}
  {mode && <Modal title='Комментарий' onClose={()=>setMode(null)} onSubmit={submit}><textarea value={text} onChange={(e)=>setText(e.target.value)} /></Modal>}</div>;
}
