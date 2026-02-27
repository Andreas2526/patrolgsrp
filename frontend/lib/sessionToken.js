export const SESSION_STORAGE_KEY = 'patrolgsrp_session_token';

export function persistSessionToken(token) {
  if (!token || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  document.cookie = `session_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
  window.dispatchEvent(new Event('session-token-updated'));
}

export function clearSessionToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = 'session_token=; path=/; max-age=0; samesite=lax';
  window.dispatchEvent(new Event('session-token-updated'));
}

export function getSessionToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}
