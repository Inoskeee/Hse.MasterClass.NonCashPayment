import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function AdminPage() {
  const [tab, setTab] = useState('counterparties');
  const [rows, setRows] = useState<any[]>([]);
  const [json, setJson] = useState('{}');
  const load = () => api<any[]>(`/api/${tab}`).then(setRows).catch((e)=>alert(e.message));
  useEffect(() => { void load(); }, [tab]);
  const add = async () => { await api(`/api/${tab}`, { method:'POST', body: json }); setJson('{}'); load(); };
  return <div><h2>Админка</h2><div className='row'>{['counterparties','budget-items','blacklist','limits'].map(t=><button key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
  <textarea value={json} onChange={(e)=>setJson(e.target.value)} /><button onClick={add}>Добавить JSON</button>
  <pre>{JSON.stringify(rows,null,2)}</pre></div>;
}
