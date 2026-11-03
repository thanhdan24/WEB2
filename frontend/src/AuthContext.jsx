import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, errorText } from './api';

export const SESSION_KEY = 'lab.auth';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [attempt, setAttempt] = useState(0);
  function clearSession() {
    delete api.defaults.headers.common.Authorization;
    try { localStorage.removeItem(SESSION_KEY); } catch { /* Storage may be disabled. */ }
    setSession(null);
  }
  useEffect(() => {
    let active = true;
    setLoading(true); setRestoreError('');
    const interceptor = api.interceptors.response.use(response => response, error => {
      if (active && error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) clearSession();
      return Promise.reject(error);
    });
    async function restore() {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { clearSession(); }
      if (!saved) { if (active) setLoading(false); return; }
      if (typeof saved.token !== 'string' || !/^[A-F0-9]{64}$/.test(saved.token) || !Number.isFinite(Date.parse(saved.expiresAt)) || Date.parse(saved.expiresAt) <= Date.now()) {
        clearSession(); setLoading(false); return;
      }
      api.defaults.headers.common.Authorization = `Bearer ${saved.token}`;
      try {
        const { data: user } = await api.get('/auth/me');
        if (active) {
          const verified = { ...saved, user }; setSession(verified);
          try { if (localStorage.getItem(SESSION_KEY) !== JSON.stringify(verified)) localStorage.setItem(SESSION_KEY, JSON.stringify(verified)); } catch { /* Keep in memory. */ }
        }
      } catch (error) { if (active && error.response?.status !== 401) setRestoreError(errorText(error)); }
      finally { if (active) setLoading(false); }
    }
    restore();
    function onStorage(event) {
      if (event.key === SESSION_KEY || event.key === null) {
        delete api.defaults.headers.common.Authorization;
        setSession(null); setLoading(true); setAttempt(value => value + 1);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => { active = false; api.interceptors.response.eject(interceptor); window.removeEventListener('storage', onStorage); };
  }, [attempt]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(clearSession, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); }
    catch {
      await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${data.token}` } });
      throw new Error('Trình duyệt không cho phép lưu phiên. Hãy bật localStorage rồi thử lại.');
    }
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setSession(data);
  }
  async function logout() {
    try { await api.post('/auth/logout'); } catch (error) { if (error.response?.status !== 401) throw error; }
    clearSession();
  }
  return <AuthContext.Provider value={{ user: session?.user, loading, restoreError, retry: () => setAttempt(value => value + 1), login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
