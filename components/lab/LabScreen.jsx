import React from 'react';
import { AnimOverlay } from './AnimOverlay';
import { Porthole } from './Porthole';
import { PetriDish } from './PetriDish';
import { CHROME, MONO } from '@/lib/tokens';

/**
 * Lab screen — the default landing screen. The dish is always geometrically
 * centred using absolute positioning (never flexbox) so overlay elements
 * can't push it off centre.
 *
 * Overlays (all position:absolute, don't affect dish centring):
 *   · top-left  → dish switcher
 *   · top-right → LVL + XP bar
 *   · top-left below  → incoming shipment card
 *
 * Reference: proto-concepts/petri-spec.md §17, petri-ui-codebasis.md §6.
 */
export function LabScreen({
  tick,
  dish,
  animations = [],
  level = 1,
  xpPercent = 0,
  shipmentReady = null,
  combineMode = false,
  combineSelectedId = null,
  onNodeTap,
  onPetriSwitch,
  onCollectShipment,
  onToggleCombine,
}) {
  const stableCount = dish.nodes.filter((n) => n.state === 'stable').length;
  const stablePct = dish.nodes.length ? Math.round((stableCount / dish.nodes.length) * 100) : 0;

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* top overlay bar — dish switcher (left) + LVL bar (right) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onPetriSwitch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: CHROME.textBody,
              fontFamily: MONO,
              fontSize: 8,
              letterSpacing: 0.5,
            }}
          >
            ☰ {dish.name}
          </button>
          <button
            onClick={onToggleCombine}
            aria-pressed={combineMode}
            style={{
              padding: '5px 9px',
              borderRadius: 10,
              border: `1px solid ${combineMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              background: combineMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              color: combineMode ? CHROME.textPrimary : CHROME.textBody,
              fontFamily: MONO,
              fontSize: 8,
              letterSpacing: 0.5,
            }}
          >
            {combineMode ? 'CANCEL' : '⇌ COMBINE'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: CHROME.textMuted, fontSize: 8, fontFamily: MONO }}>
            LVL {level}
          </span>
          <div
            style={{
              width: 48,
              height: 2,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 1,
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, xpPercent))}%`,
                height: '100%',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* shipment card — top-left overlay, visible when something is ready */}
      {shipmentReady && (
        <button
          onClick={onCollectShipment}
          style={{
            position: 'absolute',
            top: 40,
            left: 16,
            zIndex: 10,
            padding: '7px 11px',
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              color: CHROME.textMuted,
              fontSize: 6.5,
              fontFamily: MONO,
              letterSpacing: 0.5,
              marginBottom: 2,
            }}
          >
            INCOMING
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontFamily: MONO }}>
            × {shipmentReady.qty} {shipmentReady.label}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 6.5,
              fontFamily: MONO,
              textAlign: 'right',
              marginTop: 2,
            }}
          >
            COLLECT ▸
          </div>
        </button>
      )}

      {/* ── DISH — always absolutely centred in available space ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
        }}
      >
        <Porthole>
          <PetriDish
            tick={tick}
            nodes={dish.nodes}
            onNodeTap={onNodeTap}
            highlightedNodeId={combineSelectedId}
          />
          <AnimOverlay animations={animations} nodes={dish.nodes} />
        </Porthole>

        {/* Below-porthole strip: dish stats normally, combine hint when armed */}
        {combineMode ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 14,
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 8,
                fontFamily: MONO,
                letterSpacing: 1,
              }}
            >
              {combineSelectedId == null ? '— TAP FIRST PARENT —' : '— TAP SECOND PARENT —'}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 14,
            }}
          >
            {[
              `DISH ${String(dish.id).padStart(2, '0')}`,
              `${dish.nodes.length} NODES`,
              `${stablePct}% STABLE`,
            ].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && (
                  <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
                )}
                <span
                  style={{
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 7.5,
                    fontFamily: MONO,
                  }}
                >
                  {label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
