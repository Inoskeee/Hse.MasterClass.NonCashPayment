import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

const demoCredentials = [
  { login: 'initiator', password: 'initiator123', role: 'Инициатор' },
  { login: 'treasurer', password: 'treasury123', role: 'Казначей' },
  { login: 'cfo', password: 'cfo123', role: 'CFO' },
  { login: 'admin', password: 'admin123', role: 'Администратор' }
];

export function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [login, setLogin] = useState('initiator');
  const [password, setPassword] = useState('initiator123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await api<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password })
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-card'>
        <h1>Вход в систему</h1>
        <p className='login-subtitle'>Введите логин и пароль для входа в систему согласования платежей.</p>

        <form className='login-form' onSubmit={submit}>
          <label>
            Логин
            <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder='Введите логин' autoComplete='username' required />
          </label>

          <label>
            Пароль
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Введите пароль'
              autoComplete='current-password'
              required
            />
          </label>

          {error && <div className='login-error'>{error}</div>}

          <button type='submit' disabled={isSubmitting}>{isSubmitting ? 'Вход...' : 'Войти'}</button>
        </form>

        <div className='login-hint'>
          <h4>Демо-учетные записи</h4>
          <ul>
            {demoCredentials.map((credential) => (
              <li key={credential.login}>
                <strong>{credential.role}</strong>: {credential.login} / {credential.password}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
