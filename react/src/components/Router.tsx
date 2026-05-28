import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const AppPage = lazy(async () => ({ default: (await import('pages/AppPage')).AppPage }));
const ComponentPage = lazy(async () => ({ default: (await import('pages/ComponentPage')).ComponentPage }));

export function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<span>Loading...</span>}>
        <Routes>
          <Route path="/ui" element={<ComponentPage />} />
          <Route path="*" element={<AppPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
