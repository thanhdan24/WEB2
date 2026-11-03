import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './AuthContext';
import { api, errorText } from './api';
import { Products } from './Products';
import '../style.css';

function AuthForm() {
  const { login } = useAuth();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const normalized = email.trim().toLowerCase();
    const invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254 ? 'Vui lòng nhập email hợp lệ.'
      : password.length < 8 || password.length > 128 || !password.trim() ? 'Mật khẩu cần từ 8 đến 128 ký tự, không chỉ chứa khoảng trắng.'
      : register && password !== confirm ? 'Mật khẩu xác nhận không khớp.' : '';
    setFailed(true);
    if (invalid) { setMessage(invalid); return; }
    setMessage(''); setBusy(true);
    try {
      if (register) {
        await api.post('/auth/register', { email: normalized, password });
        setRegister(false); setPassword(''); setConfirm('');
        setFailed(false); setMessage('Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.');
      } else { await login(normalized, password); }
    } catch (error) { setMessage(error.response || error.isAxiosError ? errorText(error) : error.message); }
    finally { setBusy(false); }
  }
  return <section className="auth-shell"><form onSubmit={submit} noValidate>
    <h2>{register ? 'Tạo tài khoản' : 'Đăng nhập'}</h2><p className="hint">Đăng nhập để xem và quản lý sản phẩm của bài thực hành.</p>
    {message && <p className={failed ? 'notice error' : 'notice success'} role={failed ? 'alert' : 'status'}>{message}</p>}
    <fieldset disabled={busy}>
      <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
      <label htmlFor="password">Mật khẩu</label><input id="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} required aria-describedby="password-hint" />
      <small id="password-hint">Từ 8 đến 128 ký tự.</small>
      {register && <><label htmlFor="confirm">Xác nhận mật khẩu</label><input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></>}
      <div className="actions"><button type="submit">{busy ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}</button>
      <button type="button" className="secondary" onClick={() => { setRegister(!register); setMessage(''); setPassword(''); setConfirm(''); }}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button></div>
    </fieldset>
  </form></section>;
}
function App() {
  const { user, loading, restoreError, retry, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');
  async function signOut() {
    setLoggingOut(true); setMessage('');
    try { await logout(); } catch (error) { setMessage(errorText(error)); }
    finally { setLoggingOut(false); }
  }
  return <main><header><span className="tag">BÀI THỰC HÀNH 1 + 2</span><h1>Quản lý sản phẩm</h1><p>React · Axios · ASP.NET Core · SQLite</p></header>
    {loading ? <p role="status">Đang kiểm tra phiên đăng nhập…</p> : restoreError ? <section className="card"><p role="alert">{restoreError}</p><button onClick={retry}>Thử kết nối lại</button></section> : user ? <>
      <div className="user-bar"><span>Đã đăng nhập: <strong>{user.email}</strong></span><button className="secondary" disabled={loggingOut} onClick={signOut}>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
      {message && <p className="notice error" role="alert">{message}</p>}<Products key={user.id} />
    </> : <AuthForm />}
  </main>;
}
createRoot(document.getElementById('root')).render(<AuthProvider><App /></AuthProvider>);
