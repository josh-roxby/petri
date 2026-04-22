'use client';

import { GeomIcon } from '@/components/shared/GeomIcon';
import { CHAKRA, CHROME, MONO } from '@/lib/tokens';
import { HOUR_MS, MINUTE_MS, SHIPMENT_CADENCE_MS, SHIPMENT_QUEUE_CAP } from '@/lib/timeDelta';

/**
 * Shipments screen — queue + collect flow for the free material drops.
 *
 * Reference: proto-concepts/petri-spec.md §4, petri-ui-codebasis.md §5.
 */

// Visual config per shipment type. Order here = display order.
const SHIPMENT_ROWS = [
  { type: 'stabiliser', label: 'Stabiliser Pack', shape: 'diamond' },
  { type: 'ingredient', label: 'Basic Ingredients', shape: 'hex' },
  // Plasm/Gel row is shown in a locked state — unlocks via Funding tree.
  { type: 'plasmaGel', label: 'Plasm/Gel', shape: 'nested', locked: true },
];

function formatCadence(ms) {
  if (ms >= HOUR_MS) {
    const h = ms / HOUR_MS;
    return h === Math.floor(h) ? `${h} hrs` : `${h.toFixed(1)} hrs`;
  }
  const m = Math.round(ms / MINUTE_MS);
  return `${m} min`;
}

function formatCountdown(ms) {
  if (ms <= 0) return 'ready';
  const mins = Math.floor(ms / MINUTE_MS);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours > 0) return `${hours}h ${rem}m`;
  if (mins > 0) return `${mins}m`;
  const secs = Math.max(1, Math.floor(ms / 1000));
  return `${secs}s`;
}

export function ShipmentsScreen({ queues, materials, now, onCollect }) {
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
        Shipments
      </div>
      <div
        style={{
          color: CHROME.textMuted,
          fontSize: 8,
          fontFamily: MONO,
          marginBottom: 18,
        }}
      >
        Free supply · queue cap: {SHIPMENT_QUEUE_CAP}
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.22)',
          fontSize: 7.5,
          fontFamily: MONO,
          letterSpacing: 1.5,
          marginBottom: 10,
        }}
      >
        PENDING
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {SHIPMENT_ROWS.map((row) => {
          const queue = queues[row.type];
          const cadenceMs = SHIPMENT_CADENCE_MS[row.type];
          const ready = !row.locked && queue?.count > 0;
          const locked = row.locked;
          // countdown to next shipment — when the queue has room
          let countdown = null;
          if (!locked && queue) {
            const lastAt = queue.lastAt ?? now;
            const next = lastAt + cadenceMs - now;
            countdown = queue.count >= SHIPMENT_QUEUE_CAP ? 'queue full' : formatCountdown(next);
          }

          return (
            <div
              key={row.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                background: ready ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  locked
                    ? 'rgba(255,255,255,0.05)'
                    : ready
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(255,255,255,0.07)'
                }`,
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GeomIcon shape={row.shape} size={26} opacity={locked ? 0.15 : 0.58} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: locked ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                    fontSize: 10.5,
                    fontFamily: MONO,
                    marginBottom: 3,
                  }}
                >
                  {row.label}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: CHROME.textMuted, fontSize: 7.5, fontFamily: MONO }}>
                    ×{queue?.count ?? 0} / {SHIPMENT_QUEUE_CAP}
                  </span>
                  <span
                    style={{
                      color: locked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.2)',
                      fontSize: 7.5,
                      fontFamily: MONO,
                    }}
                  >
                    every {formatCadence(cadenceMs)}
                  </span>
                </div>
              </div>
              {locked ? (
                <span
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 7.5,
                    fontFamily: CHAKRA,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  Locked
                </span>
              ) : ready ? (
                <button
                  onClick={() => onCollect(row.type)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.07)',
                    color: CHROME.textPrimary,
                    fontSize: 8.5,
                    fontFamily: MONO,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Collect ×{queue.count}
                </button>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontFamily: MONO }}>
                  {countdown}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.22)',
          fontSize: 7.5,
          fontFamily: MONO,
          letterSpacing: 1.5,
          marginBottom: 10,
        }}
      >
        ON HAND
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {SHIPMENT_ROWS.filter((r) => !r.locked).map((row) => (
          <div
            key={row.type}
            style={{
              flex: '1 1 0',
              minWidth: 120,
              padding: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <GeomIcon shape={row.shape} size={22} opacity={0.5} />
            <div style={{ flex: 1 }}>
              <div style={{ color: CHROME.textBody, fontSize: 8.5, fontFamily: MONO }}>
                {row.label}
              </div>
              <div
                style={{
                  color: CHROME.textPrimary,
                  fontSize: 13,
                  fontFamily: MONO,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {materials[row.type] ?? 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
