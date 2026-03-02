import { ReactNode } from 'react';

export function Modal({ title, children, onClose, onSubmit }: { title: string; children: ReactNode; onClose: () => void; onSubmit: () => void }) {
  return (
    <div className='modal-overlay'>
      <div className='modal'>
        <h3>{title}</h3>
        {children}
        <div className='row'>
          <button onClick={onClose}>Отмена</button>
          <button onClick={onSubmit}>Подтвердить</button>
        </div>
      </div>
    </div>
  );
}
