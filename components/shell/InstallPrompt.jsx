'use client';

import { useEffect, useRef, useState } from 'react';
import { CHAKRA, CHROME, MONO, Z } from '@/lib/tokens';

/**
 * In-app install affordance. Floats above the bottom nav.
 *
 * Behaviour:
 *   - Chrome/Edge/Android: captures `beforeinstallprompt`, shows an INSTALL
 *     chip, triggers the native prompt on tap
 *   - iOS Safari (no beforeinstallprompt support): detects a standalone-
 *     capable iOS browser and shows a Share → Add to Home Screen hint
 *   - Hides when the app is already installed (`display-mode: standalone`)
 *     or the user dismisses the prompt
 *
 * The dismissal is session-scoped (sessionStorage) so the hint doesn't
 * nag on every page load, but still returns for a fresh visit.
 */

const DISMISS_KEY = 'petri_install_dismissed';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  // Chrome/Android
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if (window.navigator.standalone) return true;
  return false;
}

function isIos() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function InstallPrompt() {
  const promptRef = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
      return;
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      promptRef.current = e;
      setCanInstall(true);
    };
    const onInstalled = () => {
      setCanInstall(false);
      setShowIosHint(false);
      promptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS: no beforeinstallprompt — show the Share hint after a brief delay
    // so it doesn't fight the initial paint.
    if (isIos()) {
      const id = setTimeout(() => setShowIosHint(true), 2500);
      return () => {
        clearTimeout(id);
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (canInstall && promptRef.current) {
      const evt = promptRef.current;
      evt.prompt();
      const choice = await evt.userChoice?.catch(() => null);
      promptRef.current = null;
      setCanInstall(false);
      // If they dismissed the native prompt, also dismiss our chip for the
      // session so we don't nag them back into it.
      if (choice?.outcome === 'dismissed') dismiss();
      return;
    }
    if (showIosHint) setIosModalOpen(true);
  };

  if (dismissed) return null;
  if (!canInstall && !showIosHint) return null;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: Z.nav - 1,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 6px 6px 12px',
          borderRadius: 14,
          background: 'rgba(20,20,20,0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <button
          onClick={handleInstall}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 6px',
            background: 'transparent',
            border: 'none',
            color: CHROME.textPrimary,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 0.8,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: 'rgba(31,204,121,0.9)',
              boxShadow: '0 0 6px rgba(31,204,121,0.5)',
            }}
          />
          INSTALL PETRI
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {iosModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIosModalOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: Z.modal,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              padding: 20,
            }}
          >
            <div
              style={{
                color: CHROME.textPrimary,
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              INSTALL PETRI
            </div>
            <ol
              style={{
                color: CHROME.textBody,
                fontFamily: CHAKRA,
                fontSize: 11,
                lineHeight: 1.7,
                margin: 0,
                paddingLeft: 18,
              }}
            >
              <li>Tap the <strong>Share</strong> button in Safari&apos;s toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Confirm with <strong>Add</strong>.</li>
            </ol>
            <button
              onClick={() => setIosModalOpen(false)}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: CHROME.textPrimary,
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
