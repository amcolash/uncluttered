import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const CategorizePage = lazy(async () => ({ default: (await import('pages/CategorizePage')).CategorizePage }));
const ComponentPage = lazy(async () => ({ default: (await import('pages/ComponentPage')).ComponentPage }));

export function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<span>Loading...</span>}>
        <Routes>
          <Route path="/ui" element={<ComponentPage />} />
          <Route path="*" element={<CategorizePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
