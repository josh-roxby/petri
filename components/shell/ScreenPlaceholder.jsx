import { CHAKRA, CHROME, MONO } from '@/lib/tokens';

/**
 * Placeholder for screens not yet built out. Replace with the real screen
 * component when that Pass 1 task lands.
 */
export function ScreenPlaceholder({ title, note = 'Pass 1 · under construction' }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 16px 0',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          color: CHROME.textPrimary,
          fontSize: 14,
          fontFamily: MONO,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: CHROME.textMuted,
          fontSize: 8,
          fontFamily: MONO,
          marginBottom: 18,
        }}
      >
        —
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: CHROME.textGhost,
          fontFamily: CHAKRA,
          fontSize: 9,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {note}
      </div>
    </div>
  );
}
