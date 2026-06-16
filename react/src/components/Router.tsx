import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useAuthStatus } from 'hooks/useAuthStatus';
import { InboxPage } from 'pages/InboxPage';

import { GoogleAuth } from './GoogleAuth';
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
  const { status, loading } = useAuthStatus();

  if (loading) return <LoadingSpinner />;
  if (!status?.tokenValid) return <GoogleAuth url={status?.url} />;

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/ui" element={<ComponentPage />} />
          <Route path="/categorize" element={<CategorizePage />} />

          <Route index element={<InboxPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
