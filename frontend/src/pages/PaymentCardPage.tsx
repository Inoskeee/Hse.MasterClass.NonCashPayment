import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';

export function PaymentCardPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  useEffect(() => { if (!id) return; api(`/api/payments/${id}`).then(setPayment); api(`/api/payments/${id}/audit`).then(setAudit); }, [id]);
  if (!payment) return null;
  return <div><h2>Карточка {payment.id}</h2><pre>{JSON.stringify(payment,null,2)}</pre><h3>Audit</h3><pre>{JSON.stringify(audit,null,2)}</pre></div>;
}
