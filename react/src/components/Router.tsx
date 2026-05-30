import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { InboxPage } from 'pages/InboxPage';

import { Spinner } from './ui/Spinner';

const CategorizePage = lazy(async () => ({ default: (await import('pages/CategorizePage')).CategorizePage }));
const ComponentPage = lazy(async () => ({ default: (await import('pages/ComponentPage')).ComponentPage }));

export function Router() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="xl" className="text-slate-300" />
          </div>
        }
      >
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
