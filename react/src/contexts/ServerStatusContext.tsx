import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API } from 'utilities/util';

interface ServerStatusContextValue {
  isServerReachable: boolean;
  setServerReachable: (reachable: boolean) => void;
  checkServer: () => Promise<boolean>;
}

const ServerStatusContext = createContext<ServerStatusContextValue | undefined>(undefined);

export function ServerStatusProvider({
  children,
  initialReachable = true,
}: {
  children: ReactNode;
  initialReachable?: boolean;
}) {
  const [isServerReachable, setServerReachable] = useState(initialReachable);

  const checkServer = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/api/categories`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        setServerReachable(true);
        return true;
      }

      setServerReachable(false);
      return false;
    } catch {
      setServerReachable(false);
      return false;
    }
  }, []);

  // Listen to browser network connectivity events
  useEffect(() => {
    const handleOnline = () => {
      checkServer();
    };

    const handleOffline = () => {
      setServerReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServer]);

  // When server is unreachable, periodically retry every 15s
  useEffect(() => {
    if (isServerReachable) return;

    const interval = setInterval(() => {
      checkServer();
    }, 15_000);

    return () => clearInterval(interval);
  }, [isServerReachable, checkServer]);

  return (
    <ServerStatusContext.Provider value={{ isServerReachable, setServerReachable, checkServer }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus(): ServerStatusContextValue {
  const context = useContext(ServerStatusContext);
  if (!context) {
    return {
      isServerReachable: true,
      setServerReachable: () => {},
      checkServer: async () => true,
    };
  }
  return context;
}
