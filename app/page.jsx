'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { Grid } from '@/components/shell/Grid';
import { NavPill } from '@/components/shell/NavPill';
import { Particles } from '@/components/shell/Particles';
import { ScreenPlaceholder } from '@/components/shell/ScreenPlaceholder';
import { LabScreen } from '@/components/lab/LabScreen';
import { NodeModal } from '@/components/lab/NodeModal';
import { useTick } from '@/lib/useTick';
import { CHROME, SHELL_MAX_W } from '@/lib/tokens';
import { useGameStore } from '@/stores/gameStore';

const SCREEN_TITLES = {
  inventory: 'Inventory',
  shipments: 'Shipments',
  discoveries: 'Discoveries',
  skills: 'Skills',
};

export default function Home() {
  const [screen, setScreen] = useState('lab');
  const [modalNodeId, setModalNodeId] = useState(null);
  const tick = useTick();

  const dishes = useGameStore((s) => s.dishes);
  const activeDishId = useGameStore((s) => s.activeDishId);
  const materials = useGameStore((s) => s.materials);
  const credits = useGameStore((s) => s.player.credits);
  const level = useGameStore((s) => s.player.level);
  const stabiliseNode = useGameStore((s) => s.stabiliseNode);
  const catalyseNode = useGameStore((s) => s.catalyseNode);
  const containNode = useGameStore((s) => s.containNode);
  const discardNode = useGameStore((s) => s.discardNode);
  const harvestNode = useGameStore((s) => s.harvestNode);

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  // Derive the live modal node from the store each render so that after an
  // action mutates state, the modal reflects the new stats.
  const modalNode =
    modalNodeId != null ? (activeDish.nodes.find((n) => n.id === modalNodeId) ?? null) : null;

  const goToScreen = (next) => {
    setScreen(next);
    setModalNodeId(null);
  };

  const handleNodeTap = (node) => {
    setModalNodeId((current) => (current === node.id ? null : node.id));
  };

  const handleAction = (actionId, node) => {
    const dishId = activeDish.id;
    switch (actionId) {
      case 'stabilise':
        stabiliseNode(dishId, node.id);
        break;
      case 'catalyse':
        catalyseNode(dishId, node.id);
        // Close the modal so the player sees the new child on the dish.
        setModalNodeId(null);
        break;
      case 'contain':
        containNode(dishId, node.id);
        break;
      case 'discard':
        discardNode(dishId, node.id);
        setModalNodeId(null);
        break;
      case 'harvest':
        harvestNode(dishId, node.id);
        setModalNodeId(null);
        break;
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: SHELL_MAX_W,
          height: '100vh',
          background: CHROME.bg,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Grid />

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.012) 0%, transparent 65%)',
          }}
        />

        <Particles tick={tick} />

        <AppHeader tick={tick} credits={credits} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden',
            paddingBottom: 80,
          }}
        >
          {screen === 'lab' ? (
            <LabScreen
              tick={tick}
              dish={activeDish}
              level={level}
              xpPercent={0}
              onNodeTap={handleNodeTap}
            />
          ) : (
            <ScreenPlaceholder title={SCREEN_TITLES[screen]} note="Pass 1 · under construction" />
          )}
        </div>

        <NavPill active={screen} onChange={goToScreen} />

        {modalNode && (
          <NodeModal
            node={modalNode}
            materials={materials}
            onClose={() => setModalNodeId(null)}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  );
}
