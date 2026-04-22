'use client';

import { useEffect, useRef } from 'react';
import { CHAKRA, CHROME, MONO, Z } from '@/lib/tokens';
import { HOUR_MS, MINUTE_MS } from '@/lib/timeDelta';

/**
 * "While you were away" summary. Surfaces offline changes so the dish
 * appearing to mutate between sessions doesn't feel like a bug.
 *
 * Reference: proto-concepts/petri-spec.md §12 (save & sync → time sim).
 */

const SHIPMENT_LABELS = {
  stabiliser: 'Stabiliser',
  ingredient: 'Basic Ingredients',
  plasmaGel: 'Plasm/Gel',
};

function formatElapsed(ms) {
  if (ms >= HOUR_MS) {
    const h = ms / HOUR_MS;
    return `${h.toFixed(1)} hrs`;
  }
  const m = Math.max(1, Math.round(ms / MINUTE_MS));
  return `${m} min`;
}

export function WhileAwayModal({ summary, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: Z.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        ref={ref}
        style={{
          width: '72%',
          background: 'rgba(6,6,6,0.99)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          borderRadius: 16,
          padding: '18px 18px 16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.95)',
        }}
      >
        <div
          style={{
            color: CHROME.textMuted,
            fontSize: 7.5,
            fontFamily: MONO,
            letterSpacing: 1.5,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}
        >
          While you were away
        </div>
        <div
          style={{
            color: CHROME.textPrimary,
            fontSize: 11,
            fontFamily: MONO,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {formatElapsed(summary.elapsedMs)} elapsed
        </div>

        {summary.shipments.length > 0 && (
          <Section title="Shipments arrived">
            {summary.shipments.map((s) => (
              <Row key={s.type} label={SHIPMENT_LABELS[s.type] ?? s.type} detail={`+${s.added}`} />
            ))}
          </Section>
        )}

        {summary.collapses.length > 0 && (
          <Section title="Collapses">
            {summary.collapses.map((c) => (
              <Row key={c.nodeId} label={c.name} detail={`${c.dishName}`} alarm />
            ))}
          </Section>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            width: '100%',
            padding: 11,
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.1)',
            color: CHROME.textPrimary,
            fontSize: 9.5,
            fontFamily: CHAKRA,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          color: CHROME.textMuted,
          fontSize: 7,
          fontFamily: MONO,
          letterSpacing: 1.5,
          marginBottom: 6,
        }}
      >
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function Row({ label, detail, alarm }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '7px 10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 7,
      }}
    >
      <span style={{ color: CHROME.textBody, fontSize: 9, fontFamily: MONO }}>{label}</span>
      <span
        style={{
          color: alarm ? '#ff5533' : CHROME.textPrimary,
          fontSize: 9,
          fontFamily: MONO,
          fontWeight: 700,
        }}
      >
        {detail}
      </span>
    </div>
  );
}
