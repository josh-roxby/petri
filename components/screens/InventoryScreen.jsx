'use client';

import { useState } from 'react';
import { AffBadge } from '@/components/shared/AffBadge';
import { BlobIcon } from '@/components/shared/BlobIcon';
import { GeomIcon } from '@/components/shared/GeomIcon';
import { Pill } from '@/components/shared/Pill';
import { CHROME, MONO } from '@/lib/tokens';

/**
 * Inventory — two tabs, Compounds (Harvest Library) and Materials.
 *
 * Reference: proto-concepts/petri-spec.md §11 (journal vs library),
 * petri-ui-codebasis.md §5.
 */

// Materials display config. `max` is a display cap for the fill bar only —
// actual stock can exceed it if the player stockpiles from Catalyst Packs etc.
const MATERIAL_ROWS = [
  { key: 'stabiliser', name: 'Stabiliser', shape: 'diamond', max: 8 },
  { key: 'ingredient', name: 'Basic Ingredient', shape: 'hex', max: 5 },
  { key: 'plasmaGel', name: 'Plasm/Gel', shape: 'nested', max: 3 },
  { key: 'bioFuel', name: 'Bio-Inc. Fuel', shape: 'triangle', max: 2 },
  { key: 'catalyst', name: 'Catalyst Pack', shape: 'cross', max: 5 },
  { key: 'antidote', name: 'Antidote Vial', shape: 'pill', max: 4 },
];

export function InventoryScreen({ compounds, materials, credits }) {
  const [tab, setTab] = useState('compounds');

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
        Inventory
      </div>
      <div style={{ color: CHROME.textMuted, fontSize: 8, fontFamily: MONO, marginBottom: 14 }}>
        {credits.toLocaleString()} credits
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        <Pill active={tab === 'compounds'} onClick={() => setTab('compounds')}>
          Compounds
        </Pill>
        <Pill active={tab === 'materials'} onClick={() => setTab('materials')}>
          Materials
        </Pill>
      </div>

      {tab === 'compounds' && (
        <>
          {compounds.length === 0 ? (
            <EmptyState text="No harvested compounds yet. Harvest a stable node to stock the library." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {compounds.map((c) => (
                <CompoundRow key={`${c.name}-${c.grade}-${c.tier}`} compound={c} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'materials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {MATERIAL_ROWS.map((m) => {
            const qty = materials[m.key] ?? 0;
            const empty = qty === 0;
            const barPct = Math.min(100, (qty / m.max) * 100);
            return (
              <div
                key={m.key}
                style={{
                  padding: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <GeomIcon shape={m.shape} size={28} opacity={empty ? 0.2 : 0.65} />
                  <span
                    style={{
                      color: empty ? 'rgba(255,255,255,0.2)' : CHROME.textPrimary,
                      fontSize: 16,
                      fontFamily: MONO,
                      fontWeight: 700,
                    }}
                  >
                    {qty}
                  </span>
                </div>
                <div
                  style={{
                    color: empty ? 'rgba(255,255,255,0.22)' : CHROME.textBody,
                    fontSize: 9,
                    fontFamily: MONO,
                    marginBottom: 8,
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 2,
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 1,
                  }}
                >
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: '100%',
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: 1,
                    }}
                  />
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 7,
                    fontFamily: MONO,
                    marginTop: 3,
                  }}
                >
                  {qty}/{m.max}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompoundRow({ compound: c }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
      }}
    >
      <BlobIcon aff={c.aff} r={16} seed={c.seed ?? 0} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ color: CHROME.textPrimary, fontSize: 10.5, fontFamily: MONO, marginBottom: 4 }}
        >
          {c.name}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <AffBadge aff={c.aff} />
          <span style={{ color: CHROME.textMuted, fontSize: 7, fontFamily: MONO }}>T{c.tier}</span>
          <span style={{ color: CHROME.textMuted, fontSize: 7, fontFamily: MONO }}>
            Grade {c.grade}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: CHROME.textPrimary, fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
          ×{c.qty}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7, fontFamily: MONO }}>
          POT {c.potency}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 12,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 8.5,
        fontFamily: MONO,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}
