'use client';

import { useEffect, useRef } from 'react';
import { AffBadge } from '@/components/shared/AffBadge';
import { ACTION_COLORS, AFF_COLORS, CHAKRA, CHROME, MONO, Z, volatilityColor } from '@/lib/tokens';

/**
 * Centred 60%-width modal. Opens when a node is tapped.
 *
 * Structure:
 *   1. affinity accent bar (3px, only decorative colour element on frame)
 *   2. header row — affinity dot + name + state label + close
 *   3. affinity chip + compound ID strip
 *   4. 2×2 stat grid (potency / volatility / purity / chaos)
 *   5. 2×2 action grid (catalyse / harvest / contain / discard)
 *   6. full-width stabilise primary
 *
 * Reference: proto-concepts/petri-spec.md §18, petri-design.md §9.
 */
const LIVE_STATES = new Set(['alive', 'stable', 'volatile', 'contained']);

export function NodeModal({ node, onClose, onAction }) {
  const ref = useRef(null);
  const c = AFF_COLORS[node.aff];
  const isLive = LIVE_STATES.has(node.state);
  const volColor = volatilityColor(node.volatility);

  // close on outside click (mousedown on backdrop, not inside modal content)
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const actions = [
    { id: 'catalyse', label: 'Catalyse', dot: ACTION_COLORS.catalyse, disabled: !isLive },
    {
      id: 'harvest',
      label: 'Harvest',
      dot: ACTION_COLORS.harvest,
      disabled: node.state === 'scar' || node.state === 'harvested',
    },
    { id: 'contain', label: 'Contain', dot: ACTION_COLORS.contain, disabled: !isLive },
    {
      id: 'discard',
      label: 'Discard',
      dot: ACTION_COLORS.discard,
      disabled: node.state === 'scar',
    },
  ];

  const stabiliseDisabled = !isLive || node.volatility === 0;

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
          width: '60%',
          background: 'rgba(6,6,6,0.99)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* 1. affinity accent bar — only decorative colour on frame */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${c}, ${c}44)` }} />

        <div style={{ padding: '14px 14px 16px' }}>
          {/* 2. header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: c,
                    boxShadow: `0 0 8px ${c}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: CHROME.textPrimary,
                    fontSize: 10,
                    fontFamily: MONO,
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <AffBadge aff={node.aff} />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.38)',
                    fontSize: 7,
                    fontFamily: CHAKRA,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {node.state}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              ×
            </button>
          </div>

          {/* 3. compound ID strip */}
          <div
            style={{
              padding: '5px 8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 7,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: 6.5,
                fontFamily: MONO,
                letterSpacing: 0.5,
              }}
            >
              ID{' '}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 6.5, fontFamily: MONO }}>
              {`AFF-${node.aff}-${String(node.id).padStart(3, '0')}-T1`}
            </span>
          </div>

          {/* 4. 2×2 stat grid — volatility is the only coloured stat */}
          {isLive && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 5,
                marginBottom: 12,
              }}
            >
              {[
                {
                  l: 'POTENCY',
                  v: node.potency,
                  barC: 'rgba(255,255,255,0.3)',
                  valC: 'rgba(255,255,255,0.75)',
                },
                { l: 'VOLATILITY', v: node.volatility, barC: volColor, valC: volColor },
                {
                  l: 'PURITY',
                  v: node.purity,
                  barC: 'rgba(255,255,255,0.3)',
                  valC: 'rgba(255,255,255,0.75)',
                },
                {
                  l: 'CHAOS',
                  v: node.chaos,
                  barC: 'rgba(255,255,255,0.22)',
                  valC: 'rgba(255,255,255,0.55)',
                },
              ].map(({ l, v, barC, valC }) => (
                <div
                  key={l}
                  style={{
                    padding: '8px 9px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.25)',
                      fontSize: 6,
                      fontFamily: MONO,
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 2,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 1,
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{
                        width: `${v}%`,
                        height: '100%',
                        background: barC,
                        borderRadius: 1,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      color: valC,
                      fontSize: 13,
                      fontFamily: MONO,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* scar / harvested notice — in place of stat grid */}
          {!isLive && (
            <div
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 9,
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: MONO }}>
                {node.state === 'scar' ? '— branch collapsed —' : '— already harvested —'}
              </span>
            </div>
          )}

          {/* 5. 2×2 action grid — white chrome, coloured dot only */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 5,
              marginBottom: 5,
            }}
          >
            {actions.map((a) => (
              <button
                key={a.id}
                disabled={a.disabled}
                onClick={() => !a.disabled && onAction?.(a.id, node)}
                style={{
                  padding: '9px 6px',
                  border: `1px solid ${a.disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.14)'}`,
                  borderRadius: 9,
                  background: a.disabled ? 'transparent' : 'rgba(255,255,255,0.04)',
                  color: a.disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.7)',
                  fontSize: 8.5,
                  fontFamily: CHAKRA,
                  letterSpacing: 0.3,
                  cursor: a.disabled ? 'default' : 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'inline-block',
                    background: a.disabled ? 'rgba(255,255,255,0.1)' : a.dot,
                    boxShadow: a.disabled ? 'none' : `0 0 5px ${a.dot}88`,
                  }}
                />
                {a.label}
              </button>
            ))}
          </div>

          {/* 6. full-width stabilise primary */}
          <button
            disabled={stabiliseDisabled}
            onClick={() => !stabiliseDisabled && onAction?.('stabilise', node)}
            style={{
              width: '100%',
              padding: 11,
              border: `1px solid ${stabiliseDisabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.4)'}`,
              borderRadius: 9,
              background: stabiliseDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.1)',
              color: stabiliseDisabled ? 'rgba(255,255,255,0.2)' : CHROME.textPrimary,
              fontSize: 9.5,
              fontFamily: CHAKRA,
              fontWeight: 600,
              letterSpacing: 1,
              cursor: stabiliseDisabled ? 'default' : 'pointer',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            {!stabiliseDisabled && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 6px rgba(255,255,255,0.6)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            STABILISE
          </button>
        </div>
      </div>
    </div>
  );
}
