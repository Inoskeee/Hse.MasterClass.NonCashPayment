import { Navigate, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { User } from './types';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreatePaymentPage } from './pages/CreatePaymentPage';
import { MyPaymentsPage } from './pages/MyPaymentsPage';
import { TreasuryQueuePage } from './pages/TreasuryQueuePage';
import { CfoQueuePage } from './pages/CfoQueuePage';
import { AdminPage } from './pages/AdminPage';
import { PaymentCardPage } from './pages/PaymentCardPage';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = (nextUser: User) => {
    setUser(nextUser);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const links = useMemo(() => ([
    <Link key='d' to='/'>Dashboard</Link>,
    <Link key='c' to='/payments/create'>Создать платеж</Link>,
    <Link key='m' to='/payments/mine'>Мои платежи</Link>,
    <Link key='t' to='/treasury'>Очередь казначейства</Link>,
    <Link key='f' to='/cfo'>Очередь CFO</Link>,
    <Link key='a' to='/admin'>Админка</Link>
  ]), []);

  if (!user) {
    return (
      <Routes>
        <Route path='/login' element={<LoginPage onLogin={login} />} />
        <Route path='*' element={<Navigate to='/login' />} />
      </Routes>
    );
  }

  if (location.pathname === '/login') {
    return <Navigate to='/' />;
  }

  return (
    <div>
      <header className='header'>
        <div className='brand'>Non-cash Payment Demo</div>
        <div className='nav'>{links}</div>
        <div>{user.name} ({user.role}) <button onClick={logout}>Сменить пользователя</button></div>
      </header>
      <main className='container'>
        <Routes>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/payments/create' element={<CreatePaymentPage />} />
          <Route path='/payments/mine' element={<MyPaymentsPage />} />
          <Route path='/payments/:id' element={<PaymentCardPage />} />
          <Route path='/treasury' element={<TreasuryQueuePage />} />
          <Route path='/cfo' element={<CfoQueuePage />} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </main>
    </div>
  );
}
