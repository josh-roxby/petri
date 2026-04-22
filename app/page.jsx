'use client';

import { CHROME, MONO, CHAKRA } from '@/lib/tokens';

export default function Home() {
  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: CHROME.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 14,
          color: CHROME.textPrimary,
          letterSpacing: 2,
        }}
      >
        PETRI
      </div>
      <div
        style={{
          fontFamily: CHAKRA,
          fontWeight: 300,
          fontSize: 9,
          color: CHROME.textMuted,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        Pass 0 · scaffold ready
      </div>
    </div>
  );
}
