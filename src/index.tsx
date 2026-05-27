import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from 'components/ErrorBoundary';
import { Router } from 'components/Router';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Router />
  </ErrorBoundary>
);
