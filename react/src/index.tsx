import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from 'components/ErrorBoundary';
import { Router } from 'components/Router';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Router />
  </ErrorBoundary>
);

// Register PWA service worker in supported browsers
if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('ServiceWorker registration failed:', err);
    });
  });
}
