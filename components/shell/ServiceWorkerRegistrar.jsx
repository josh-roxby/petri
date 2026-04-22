'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount in production only. Dev-mode SW
 * caches stale Next.js HMR assets and causes confusing behaviour, so it's
 * gated behind NODE_ENV.
 *
 * Mount once, at the root layout. The SW itself lives at /sw.js and handles
 * precache + cache-first static asset strategy.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[petri] SW registration failed:', err);
        });
    };

    // Defer to window load so we don't contend with the initial paint.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
