'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { Grid } from '@/components/shell/Grid';
import { NavPill } from '@/components/shell/NavPill';
import { Particles } from '@/components/shell/Particles';
import { ScreenPlaceholder } from '@/components/shell/ScreenPlaceholder';
import { useTick } from '@/lib/useTick';
import { CHROME, SHELL_MAX_W } from '@/lib/tokens';

const SCREEN_TITLES = {
  lab: 'Lab',
  inventory: 'Inventory',
  shipments: 'Shipments',
  discoveries: 'Discoveries',
  skills: 'Skills',
};

export default function Home() {
  const [screen, setScreen] = useState('lab');
  const tick = useTick();

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

        {/* ambient radial glow */}
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

        <AppHeader tick={tick} credits={4280} />

        {/* content area — only this scrolls, per screen */}
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
          <ScreenPlaceholder
            title={SCREEN_TITLES[screen]}
            note={screen === 'lab' ? 'Lab screen · next up' : 'Pass 1 · under construction'}
          />
        </div>

        <NavPill active={screen} onChange={setScreen} />
      </div>
    </div>
  );
}
