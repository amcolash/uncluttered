const PORT = 7001;

// In development with a separate Vite dev server, target the backend port directly.
// In production (e.g. via Cloudflare tunnel on mail.amcolash.com or reverse proxy),
// use relative URLs so requests stay on the same origin and protocol.
export const API =
  import.meta.env.DEV && window.location.port && window.location.port !== `${PORT}`
    ? `${window.location.protocol}//${window.location.hostname}:${PORT}`
    : '';

export function formatCategory(key: string) {
  return key
    .toLowerCase()
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Completely purges PWA caches and unregisters active service workers
 * before refreshing the page, ensuring the user gets fresh assets from the server.
 */
export async function clearPwaCacheAndReload() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } catch (err) {
    console.error('Failed to clear PWA cache:', err);
  }
  window.location.reload();
}
