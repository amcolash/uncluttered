import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ServerStatusProvider } from 'contexts/ServerStatusContext';
import { useAuthStatus } from 'hooks/useAuthStatus';
import { InboxPage } from 'pages/InboxPage';

import { GoogleAuth } from './GoogleAuth';
import { ServerStatusLabel } from './ServerStatusLabel';
import { Spinner } from './ui/Spinner';

const CategorizePage = lazy(async () => ({ default: (await import('pages/CategorizePage')).CategorizePage }));
const ComponentPage = lazy(async () => ({ default: (await import('pages/ComponentPage')).ComponentPage }));

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Spinner size="xl" className="text-slate-300" />
    </div>
  );
}

export function Router() {
  const { status, loading, error, isResetting, checkStatus, resetAuth } = useAuthStatus();

  if (loading && !status && !error) return <LoadingSpinner />;

  // Only show GoogleAuth when the server explicitly responded that the token is invalid
  if (status && !status.tokenValid) {
    return (
      <GoogleAuth url={status?.url} error={error} isResetting={isResetting} onReset={resetAuth} onCheck={checkStatus} />
    );
  }

  // If server could not be reached, allow the cached app to still render and show the status label
  const initialReachable = !error || Boolean(status);

  return (
    <ServerStatusProvider initialReachable={initialReachable}>
      <ServerStatusLabel />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/ui" element={<ComponentPage />} />
            <Route path="/inbox" element={<InboxPage />} />

            <Route index element={<CategorizePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ServerStatusProvider>
  );
}
