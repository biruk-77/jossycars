import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rceth_token');
    if (!token) { setLoading(false); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => setUser({ ...u, token }))
      .catch(() => localStorage.removeItem('rceth_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('rceth_token', data.token);
    setUser({ username: data.username, role: data.role, name: data.name, phone: data.phone, token: data.token });
    return data;
  };

  const signup = async (form) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    localStorage.setItem('rceth_token', data.token);
    setUser({ username: data.username, role: data.role, name: data.name, phone: data.phone, token: data.token });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('rceth_token');
    setUser(null);
  };

  return { user, loading, login, signup, logout };
}
