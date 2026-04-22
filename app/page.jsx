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
  const [nodeModal, setNodeModal] = useState(null);
  const tick = useTick();

  const dishes = useGameStore((s) => s.dishes);
  const activeDishId = useGameStore((s) => s.activeDishId);
  const credits = useGameStore((s) => s.player.credits);
  const level = useGameStore((s) => s.player.level);

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  // If the player opens a screen other than Lab, clear any open node modal.
  const goToScreen = (next) => {
    setScreen(next);
    setNodeModal(null);
  };

  // Toggle: tapping the same node twice closes the modal.
  const handleNodeTap = (node) => {
    setNodeModal((current) => (current?.id === node.id ? null : node));
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

        {nodeModal && (
          <NodeModal
            node={nodeModal}
            onClose={() => setNodeModal(null)}
            onAction={(actionId) => {
              // Action stubs land with lib/gameLogic.js in the next slice.
              // For now just close the modal so taps feel responsive.
              if (actionId) setNodeModal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
