import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const AppPage = lazy(async () => ({ default: (await import('pages/AppPage')).AppPage }));

export function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<span>Loading...</span>}>
        <Routes>
          <Route path="*" element={<AppPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
