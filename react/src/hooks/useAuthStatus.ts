import { useEffect, useState } from 'react';
import { API } from 'utilities/util';

export function useAuthStatus() {
  const [status, setStatus] = useState<{ tokenValid: boolean; url: string }>();
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    const data = await fetch(`${API}/api/auth/status`)
      .then((res) => res.json())
      .catch((err) => console.error(err));

    setLoading(false);

    if (!data) return;
    setStatus(data);
  };

  useEffect(() => {
    checkStatus();

    const interval = setInterval(checkStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}
