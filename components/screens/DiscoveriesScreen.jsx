'use client';

import { useState } from 'react';
import { AffBadge } from '@/components/shared/AffBadge';
import { BlobIcon } from '@/components/shared/BlobIcon';
import { CHAKRA, CHROME, MONO } from '@/lib/tokens';

/**
 * Discoveries — Pokédex-style grid of every compound ever synthesised.
 * Known entries show a blob + name + rarity. Unknown slots are dashed
 * placeholders. Tapping an entry expands a detail panel below the grid.
 *
 * Reference: proto-concepts/petri-spec.md §11, petri-ui-codebasis.md §5.
 */

// Rarity ladder derived from tier. Tuning constant for Pass 1 — landmark
// compound list (spec open question) may refine this later.
const TIER_TO_RARITY = ['Common', 'Common', 'Uncommon', 'Rare', 'Epic'];

const RARITY_COLOUR = {
  Common: 'rgba(255,255,255,0.4)',
  Uncommon: '#a3dd28',
  Rare: '#44aaff',
  Epic: '#cc66ff',
};

// Placeholder slots shown as `???` so the grid hints at compounds yet to be
// discovered. Real landmark list lands in Pass 4.
const PLACEHOLDER_SLOTS = 4;

function rarityOf(tier) {
  return TIER_TO_RARITY[tier] ?? 'Common';
}

function formatFound(ts) {
  if (!ts) return 'seed';
  const d = Date.now() - ts;
  const mins = Math.round(d / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function DiscoveriesScreen({ journal }) {
  const [selectedId, setSelectedId] = useState(null);

  const found = journal.length;
  const total = found + PLACEHOLDER_SLOTS;
  const progress = total > 0 ? (found / total) * 100 : 0;

  const selected = selectedId ? journal.find((j) => j.name === selectedId) : null;

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
        Discoveries
      </div>
      <div style={{ color: CHROME.textMuted, fontSize: 8, fontFamily: MONO, marginBottom: 8 }}>
        {found} / {total} found
      </div>
      <div
        style={{
          width: '100%',
          height: 3,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 2,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 2,
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {journal.map((entry) => (
          <DiscoveryTile
            key={entry.name}
            entry={entry}
            active={selectedId === entry.name}
            onClick={() => setSelectedId(selectedId === entry.name ? null : entry.name)}
          />
        ))}
        {Array.from({ length: PLACEHOLDER_SLOTS }, (_, i) => (
          <PlaceholderTile key={`unk-${i}`} />
        ))}
      </div>

      {selected && <DetailPanel entry={selected} />}
    </div>
  );
}

function DiscoveryTile({ entry, active, onClick }) {
  const rarity = rarityOf(entry.tier);
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '12px 8px',
        background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <BlobIcon aff={entry.aff} r={13} seed={entry.seed ?? 0} />
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 8,
          fontFamily: MONO,
          marginBottom: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {entry.name}
      </div>
      <div style={{ color: RARITY_COLOUR[rarity], fontSize: 7, fontFamily: MONO }}>{rarity}</div>
    </button>
  );
}

function PlaceholderTile() {
  return (
    <div
      aria-hidden
      style={{
        padding: '12px 8px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '1px dashed rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>?</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: MONO }}>???</div>
      <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 7, fontFamily: MONO }}>—</div>
    </div>
  );
}

function DetailPanel({ entry }) {
  const rarity = rarityOf(entry.tier);
  const idLabel = `AFF-${entry.aff}-${String(entry.seed ?? 0)
    .padStart(3, '0')
    .slice(-3)}`;
  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <BlobIcon aff={entry.aff} r={20} seed={entry.seed ?? 0} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: CHROME.textPrimary,
              fontSize: 12,
              fontFamily: MONO,
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            {entry.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <AffBadge aff={entry.aff} />
            <span style={{ color: RARITY_COLOUR[rarity], fontSize: 8, fontFamily: MONO }}>
              {rarity}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          ['TIER', `Tier ${entry.tier}`],
          ['FOUND', formatFound(entry.foundAt)],
          ['ID', idLabel],
        ].map(([label, value]) => (
          <div key={label} style={{ minWidth: 70 }}>
            <div
              style={{
                color: CHROME.textMuted,
                fontSize: 6.5,
                fontFamily: CHAKRA,
                letterSpacing: 1,
                marginBottom: 3,
              }}
            >
              {label}
            </div>
            <div style={{ color: CHROME.textBody, fontSize: 9, fontFamily: MONO }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
