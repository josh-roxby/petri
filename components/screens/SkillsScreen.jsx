'use client';

import { useState } from 'react';
import { Pill } from '@/components/shared/Pill';
import {
  FUNDING_NODES,
  HARVEST_NODES,
  SKILL_TREES,
  TOOLING_NODES,
  canUnlock,
} from '@/lib/skills';
import { CHAKRA, CHROME, MONO } from '@/lib/tokens';

/**
 * Skills screen — three sub-tabs (Harvest / Funding / Tooling).
 * Each tab shows a tree XP bar and an SVG skill tree.
 *
 * Node states:
 *   active   = unlocked (white fill + centre dot)
 *   available = unlockable now (dim fill, highlighted border)
 *   locked   = can't unlock yet (hollow + lock glyph)
 *
 * Reference: proto-concepts/petri-spec.md §9, §17 (Skills section).
 */

const TREE_TABS = [
  { id: 'harvest', label: 'Harvest', nodes: HARVEST_NODES },
  { id: 'funding', label: 'Funding', nodes: FUNDING_NODES },
  { id: 'tooling', label: 'Tooling', nodes: TOOLING_NODES },
];

// XP thresholds for the tree-level progress bar display (T2/T3/T4 unlock cost sums).
const TREE_XP_MAX = 800 + 350 * 3 + 100 * 2; // rough total for a full tree

export function SkillsScreen({ skills, onUnlock }) {
  const [tab, setTab] = useState('harvest');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const treeState = skills[tab] ?? { xp: 0, unlocked: ['h0', 'f0', 't0'].filter((id) => id.startsWith(tab[0])) };
  const unlockedSet = new Set(treeState.unlocked);
  const nodes = SKILL_TREES[tab] ?? [];

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedUnlocked = selectedNode ? unlockedSet.has(selectedNode.id) : false;
  const selectedAvailable = selectedNode ? canUnlock(tab, selectedNode.id, unlockedSet) : false;
  const selectedAffordable = selectedNode ? treeState.xp >= selectedNode.cost : false;

  const xpBarPct = Math.min(100, (treeState.xp / TREE_XP_MAX) * 100);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* top bar */}
      <div
        style={{
          padding: '14px 20px 0',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            color: CHROME.textPrimary,
            fontSize: 11,
            fontFamily: MONO,
            fontWeight: 700,
            marginBottom: 2,
          }}
        >
          Skills
        </div>
        <div
          style={{
            color: CHROME.textMuted,
            fontSize: 7.5,
            fontFamily: CHAKRA,
            marginBottom: 12,
          }}
        >
          Unlock nodes to improve your lab capabilities.
        </div>

        {/* tab row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TREE_TABS.map((t) => (
            <Pill
              key={t.id}
              active={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setSelectedNodeId(null);
              }}
            >
              {t.label}
            </Pill>
          ))}
        </div>

        {/* tree XP bar */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span style={{ color: CHROME.textMuted, fontSize: 7, fontFamily: MONO }}>
              TREE XP
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, fontFamily: MONO }}>
              {treeState.xp} available
            </span>
          </div>
          <div
            style={{
              height: 3,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 2,
            }}
          >
            <div
              style={{
                width: `${xpBarPct}%`,
                height: '100%',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                transition: 'width 0.4s',
              }}
            />
          </div>
        </div>
      </div>

      {/* SVG skill tree */}
      <div style={{ flexShrink: 0, padding: '0 20px' }}>
        <SkillTree
          nodes={nodes}
          unlockedSet={unlockedSet}
          treeXp={treeState.xp}
          selectedNodeId={selectedNodeId}
          onSelect={(id) => setSelectedNodeId((cur) => (cur === id ? null : id))}
        />
      </div>

      {/* node detail card */}
      {selectedNode && (
        <div style={{ padding: '0 20px 32px', flexShrink: 0 }}>
          <NodeCard
            node={selectedNode}
            unlocked={selectedUnlocked}
            available={selectedAvailable}
            affordable={selectedAffordable}
            treeXp={treeState.xp}
            onUnlock={() => onUnlock(tab, selectedNode.id)}
          />
        </div>
      )}

      {!selectedNode && (
        <div
          style={{
            padding: '12px 20px 32px',
            color: CHROME.textMuted,
            fontSize: 7.5,
            fontFamily: CHAKRA,
            textAlign: 'center',
          }}
        >
          Tap a node to view details.
        </div>
      )}
    </div>
  );
}

// ── SVG Tree ─────────────────────────────────────────────────────────
function SkillTree({ nodes, unlockedSet, treeXp, selectedNodeId, onSelect }) {
  // Build edge list from prereqs.
  const edges = [];
  for (const node of nodes) {
    for (const prereqId of node.prereqs) {
      const from = nodes.find((n) => n.id === prereqId);
      if (from) edges.push({ from, to: node });
    }
  }

  return (
    <svg
      viewBox="0 0 300 320"
      width="100%"
      style={{ display: 'block', maxHeight: 320 }}
    >
      {/* tier labels */}
      {[1, 2, 3, 4].map((tier, i) => {
        const y = [40, 120, 200, 280][i];
        return (
          <text
            key={tier}
            x={12}
            y={y + 4}
            fill="rgba(255,255,255,0.18)"
            fontSize={7}
            fontFamily="monospace"
            textAnchor="start"
          >
            T{tier}
          </text>
        );
      })}

      {/* edges (behind nodes) */}
      {edges.map(({ from, to }) => {
        const fromUnlocked = unlockedSet.has(from.id);
        const toUnlocked = unlockedSet.has(to.id);
        return (
          <line
            key={`${from.id}-${to.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={fromUnlocked && toUnlocked ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={1}
          />
        );
      })}

      {/* nodes */}
      {nodes.map((node) => {
        const unlocked = unlockedSet.has(node.id);
        const available = canUnlock(
          node.id[0] === 'h' ? 'harvest' : node.id[0] === 'f' ? 'funding' : 'tooling',
          node.id,
          unlockedSet
        );
        const affordable = treeXp >= node.cost;
        const selected = selectedNodeId === node.id;
        return (
          <SkillNode
            key={node.id}
            node={node}
            unlocked={unlocked}
            available={available}
            affordable={affordable}
            selected={selected}
            onSelect={onSelect}
          />
        );
      })}
    </svg>
  );
}

function SkillNode({ node, unlocked, available, affordable, selected, onSelect }) {
  const r = 11;

  let fillColor = 'transparent';
  let strokeColor = 'rgba(255,255,255,0.15)';
  let strokeWidth = 1;
  let opacity = 0.45;

  if (unlocked) {
    fillColor = 'rgba(255,255,255,0.12)';
    strokeColor = 'rgba(255,255,255,0.5)';
    strokeWidth = 1.5;
    opacity = 1;
  } else if (available && affordable) {
    strokeColor = 'rgba(255,255,255,0.45)';
    strokeWidth = 1.5;
    opacity = 0.9;
  } else if (available) {
    strokeColor = 'rgba(255,255,255,0.3)';
    opacity = 0.7;
  }

  if (selected) {
    strokeColor = 'rgba(255,255,255,0.85)';
    strokeWidth = 2;
    opacity = 1;
  }

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(node.id)}
      opacity={opacity}
    >
      <circle cx={node.x} cy={node.y} r={r + 6} fill="transparent" />
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {unlocked && (
        <circle cx={node.x} cy={node.y} r={3} fill="rgba(255,255,255,0.8)" />
      )}
      {!unlocked && available && affordable && (
        <circle
          cx={node.x}
          cy={node.y}
          r={3}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
        />
      )}
      {!unlocked && !available && (
        <text
          x={node.x}
          y={node.y + 3}
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          fontSize={8}
          fontFamily="monospace"
        >
          ⌊
        </text>
      )}
      <text
        x={node.x}
        y={node.y + r + 10}
        textAnchor="middle"
        fill={unlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}
        fontSize={6}
        fontFamily="monospace"
      >
        {node.label}
      </text>
    </g>
  );
}

// ── Node detail card ──────────────────────────────────────────────────
function NodeCard({ node, unlocked, available, affordable, treeXp, onUnlock }) {
  const canBuy = available && affordable && !unlocked;
  const borderColor = unlocked
    ? 'rgba(255,255,255,0.15)'
    : available
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(255,255,255,0.07)';

  return (
    <div
      style={{
        padding: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <div>
          <div
            style={{
              color: unlocked ? CHROME.textPrimary : 'rgba(255,255,255,0.7)',
              fontSize: 10,
              fontFamily: MONO,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            {node.label}
          </div>
          <div style={{ color: CHROME.textMuted, fontSize: 7, fontFamily: MONO }}>
            T{node.tier} node · {node.id.toUpperCase()}
          </div>
        </div>
        {unlocked ? (
          <div
            style={{
              padding: '4px 9px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 7,
              fontFamily: MONO,
            }}
          >
            ✓ ACTIVE
          </div>
        ) : (
          <div
            style={{
              color: affordable ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
              fontSize: 7,
              fontFamily: MONO,
            }}
          >
            {node.cost === 0 ? 'FREE' : `${node.cost} XP`}
          </div>
        )}
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 9,
          fontFamily: CHAKRA,
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        {node.desc}
      </div>

      {!unlocked && (
        <button
          disabled={!canBuy}
          onClick={onUnlock}
          style={{
            width: '100%',
            padding: '9px 0',
            borderRadius: 10,
            border: `1px solid ${canBuy ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            background: canBuy ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: canBuy ? CHROME.textPrimary : 'rgba(255,255,255,0.2)',
            fontSize: 9,
            fontFamily: MONO,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {!available
            ? 'PREREQUISITES REQUIRED'
            : !affordable
              ? `NEED ${node.cost - treeXp} MORE XP`
              : `UNLOCK · ${node.cost} XP`}
        </button>
      )}
    </div>
  );
}
