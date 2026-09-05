import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('campussafe_user') ?? 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('campussafe_token')) && !user);

  useEffect(() => {
    if (!localStorage.getItem('campussafe_token')) return;
    api.get('/api/auth/me')
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        localStorage.setItem('campussafe_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('campussafe_token');
        localStorage.removeItem('campussafe_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier, password) {
    const result = await api.post('/api/auth/login', { identifier, password });
    localStorage.setItem('campussafe_token', result.token);
    localStorage.setItem('campussafe_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem('campussafe_token');
    localStorage.removeItem('campussafe_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
