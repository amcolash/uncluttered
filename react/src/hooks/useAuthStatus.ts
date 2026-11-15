import { useCallback, useEffect, useState } from 'react';
import { API } from 'utilities/util';

export function useAuthStatus() {
  const [status, setStatus] = useState<{ tokenValid: boolean; url?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/status`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
      if (data.tokenValid) {
        setError(null);
      }
    } catch (err: any) {
      console.error('[AuthStatus] Failed to check status:', err);
      setError(err?.message || 'Failed to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAuth = useCallback(async () => {
    try {
      setIsResetting(true);
      setError(null);
      const res = await fetch(`${API}/api/auth/reset`, { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Failed to reset auth (status ${res.status})`);
      }
      const data = await res.json();
      setStatus({ tokenValid: false, url: data.url });
      return data.url;
    } catch (err: any) {
      console.error('[AuthStatus] Failed to reset auth:', err);
      setError(err?.message || 'Failed to reset authentication.');
      return undefined;
    } finally {
      setIsResetting(false);
    }
  }, []);

  useEffect(() => {
    // Check if we arrived via OAuth redirect with query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const authStatus = searchParams.get('auth');
    const authMessage = searchParams.get('message');

    if (authStatus) {
      if (authStatus === 'error') {
        setError(authMessage || 'Authentication failed. Please try again.');
      } else if (authStatus === 'success') {
        setError(null);
      }

      // Clean query params from address bar without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }

    checkStatus();

    // Re-check periodically
    const interval = setInterval(checkStatus, 30 * 1000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return { status, loading, error, isResetting, checkStatus, resetAuth };
}
