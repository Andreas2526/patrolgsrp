'use client';

import { useEffect, useState } from 'react';
import { clearSessionToken, getSessionToken } from '../lib/sessionToken';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function AuthStatus() {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  const loadUser = async () => {
    const token = getSessionToken();

    if (!token) {
      setStatus('logged_out');
      setUser(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/session/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        clearSessionToken();
        setStatus('logged_out');
        setUser(null);
        return;
      }

      const payload = await response.json();
      setUser(payload.user);
      setStatus('logged_in');
    } catch (error) {
      setStatus('error');
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    const refresh = () => loadUser();
    window.addEventListener('session-token-updated', refresh);
    return () => window.removeEventListener('session-token-updated', refresh);
  }, []);

  if (status === 'loading') {
    return <p>Checking session…</p>;
  }

  if (status === 'logged_in' && user) {
    return (
      <div>
        <p>Logged in as {user.username}</p>
        <button type="button" onClick={clearSessionToken}>
          Log out
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return <p>Unable to verify login right now.</p>;
  }

  return <p>You are not logged in.</p>;
}
