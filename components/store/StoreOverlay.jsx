'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AffBadge } from '@/components/shared/AffBadge';
import { BlobIcon } from '@/components/shared/BlobIcon';
import { GeomIcon } from '@/components/shared/GeomIcon';
import { Pill } from '@/components/shared/Pill';
import {
  msUntilNextDay,
  rollBuyInventory,
  rollSpecialOffer,
  sellPrice,
  sellPriceBand,
} from '@/lib/economy';
import { CHAKRA, CHROME, MONO, Z } from '@/lib/tokens';

/**
 * Bottom-sheet store. Three tabs — Buy / Sell / Special. Prices are
 * deterministic per (storeSeed, item) so every render of the same day
 * shows the same numbers.
 *
 * Reference: proto-concepts/petri-spec.md §8, petri-ui-codebasis.md §11.
 */

const MATERIAL_SHAPE = {
  stabiliser: 'diamond',
  ingredient: 'hex',
  plasmaGel: 'nested',
  bioFuel: 'triangle',
  catalyst: 'cross',
  antidote: 'pill',
};

const MATERIAL_LABEL = {
  stabiliser: 'Stabiliser',
  ingredient: 'Basic Ingredient',
  plasmaGel: 'Plasm/Gel',
  bioFuel: 'Bio-Inc. Fuel',
  catalyst: 'Catalyst Pack',
  antidote: 'Antidote Vial',
};

function formatCountdown(ms) {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}

export function StoreOverlay({
  storeSeed,
  storeSpecialPurchased,
  credits,
  compounds,
  onBuy,
  onSell,
  onBuySpecial,
  onClose,
}) {
  const ref = useRef(null);
  const [tab, setTab] = useState('buy');
  const [countdownMs, setCountdownMs] = useState(() => msUntilNextDay());

  // Outside-click close — respects the bottom-sheet card boundary.
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // "Next offer in" countdown refresh — cheap 30s tick.
  useEffect(() => {
    const id = setInterval(() => setCountdownMs(msUntilNextDay()), 30_000);
    return () => clearInterval(id);
  }, []);

  const buyList = useMemo(
    () => (storeSeed == null ? [] : rollBuyInventory(storeSeed)),
    [storeSeed]
  );

  const special = useMemo(
    () => (storeSeed == null ? null : rollSpecialOffer(storeSeed)),
    [storeSeed]
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: Z.store,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        ref={ref}
        style={{
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '78%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* header — drag handle, title, credits, close */}
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 3,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              margin: '0 auto 14px',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  color: CHROME.textPrimary,
                  fontSize: 14,
                  fontFamily: MONO,
                  fontWeight: 700,
                }}
              >
                Store
              </div>
              <div style={{ color: CHROME.textMuted, fontSize: 8, fontFamily: MONO }}>
                Prices reset daily · {credits.toLocaleString()} ◈
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <Pill active={tab === 'buy'} onClick={() => setTab('buy')}>
              Buy
            </Pill>
            <Pill active={tab === 'sell'} onClick={() => setTab('sell')}>
              Sell
            </Pill>
            <Pill active={tab === 'special'} onClick={() => setTab('special')}>
              Special ✦
            </Pill>
          </div>
        </div>

        {/* scrolling tab content */}
        <div style={{ overflowY: 'auto', padding: '4px 20px 32px' }}>
          {tab === 'buy' && <BuyTab list={buyList} credits={credits} onBuy={onBuy} />}
          {tab === 'sell' && (
            <SellTab compounds={compounds} storeSeed={storeSeed} onSell={onSell} />
          )}
          {tab === 'special' && (
            <SpecialTab
              offer={special}
              credits={credits}
              purchased={storeSpecialPurchased}
              countdownMs={countdownMs}
              onBuy={onBuySpecial}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── BUY ──────────────────────────────────────────────────────────────
function BuyTab({ list, credits, onBuy }) {
  if (list.length === 0) return <Empty text="Store rotation not loaded yet." />;
  return (
    <>
      {list.map((item) => {
        const affordable = credits >= item.price;
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GeomIcon shape={MATERIAL_SHAPE[item.material]} size={22} opacity={0.65} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 10,
                  fontFamily: MONO,
                  marginBottom: 3,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  color: CHROME.textMuted,
                  fontSize: 7,
                  fontFamily: MONO,
                }}
              >
                {MATERIAL_LABEL[item.material]}
                {item.alwaysAvailable ? ' · always in stock' : ''}
              </div>
            </div>
            <button
              disabled={!affordable}
              onClick={() => affordable && onBuy(item.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: `1px solid ${affordable ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                background: affordable ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: affordable ? CHROME.textPrimary : 'rgba(255,255,255,0.25)',
                fontSize: 9,
                fontFamily: MONO,
                whiteSpace: 'nowrap',
              }}
            >
              {item.price} ◈
            </button>
          </div>
        );
      })}
    </>
  );
}

// ── SELL ─────────────────────────────────────────────────────────────
function SellTab({ compounds, storeSeed, onSell }) {
  if (compounds.length === 0) {
    return <Empty text="No compounds to sell. Harvest a stable node to stock the library." />;
  }
  return (
    <>
      {compounds.map((c) => {
        const key = `${c.name}|${c.grade}|${c.tier}`;
        const today = storeSeed != null ? sellPrice(c, storeSeed) : 0;
        const band = sellPriceBand(c);
        const bandPos =
          band.max === band.min ? 50 : ((today - band.min) / (band.max - band.min)) * 100;
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <BlobIcon aff={c.aff} r={14} seed={c.seed ?? 0} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 10,
                  fontFamily: MONO,
                  marginBottom: 3,
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  marginBottom: 5,
                  flexWrap: 'wrap',
                }}
              >
                <AffBadge aff={c.aff} />
                <span style={{ color: CHROME.textMuted, fontSize: 7, fontFamily: MONO }}>
                  T{c.tier} · Grade {c.grade} · ×{c.qty}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7, fontFamily: MONO }}>
                  {band.min}–{band.max}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 1,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.max(0, Math.min(100, bandPos))}%`,
                      top: -2,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.55)',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 9,
                    fontFamily: MONO,
                    fontWeight: 700,
                  }}
                >
                  {today}
                </span>
              </div>
            </div>
            <button
              onClick={() => onSell(key, 1)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.07)',
                color: CHROME.textPrimary,
                fontSize: 9,
                fontFamily: MONO,
                whiteSpace: 'nowrap',
              }}
            >
              Sell
            </button>
          </div>
        );
      })}
    </>
  );
}

// ── SPECIAL ──────────────────────────────────────────────────────────
function SpecialTab({ offer, credits, purchased, countdownMs, onBuy }) {
  const bought = purchased && offer && purchased === offer.id;
  return (
    <>
      {offer && (
        <div
          style={{
            padding: 16,
            background: bought ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${bought ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 14,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div
              style={{
                color: bought ? 'rgba(255,255,255,0.4)' : CHROME.textPrimary,
                fontSize: 12,
                fontFamily: MONO,
                fontWeight: 700,
              }}
            >
              {offer.label}
            </div>
            <span style={{ color: 'rgba(255,200,50,0.7)', fontSize: 8, fontFamily: MONO }}>
              ⏱ {formatCountdown(countdownMs)}
            </span>
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 9,
              fontFamily: MONO,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            {offer.desc}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7, fontFamily: MONO }}>
              {bought ? 'ALREADY CLAIMED' : 'LIMITED · 1 AVAILABLE'}
            </span>
            <button
              disabled={bought || credits < offer.price}
              onClick={onBuy}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                border: `1px solid ${bought ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.3)'}`,
                background:
                  bought || credits < offer.price
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.08)',
                color: bought || credits < offer.price ? 'rgba(255,255,255,0.25)' : '#fff',
                fontSize: 10,
                fontFamily: MONO,
                fontWeight: 700,
              }}
            >
              {bought ? '✓' : `${offer.price} ◈`}
            </button>
          </div>
        </div>
      )}
      {!offer && <Empty text="No special offers today. Check back after the next rotation." />}
      <div
        style={{
          padding: 14,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 14,
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        <div
          style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: MONO, marginBottom: 4 }}
        >
          Next offer in
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: MONO }}>
          {formatCountdown(countdownMs)}
        </div>
      </div>
    </>
  );
}

function Empty({ text }) {
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
        fontFamily: CHAKRA,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}
