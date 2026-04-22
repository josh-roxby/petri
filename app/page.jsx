'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { Grid } from '@/components/shell/Grid';
import { NavPill } from '@/components/shell/NavPill';
import { Particles } from '@/components/shell/Particles';
import { ScreenPlaceholder } from '@/components/shell/ScreenPlaceholder';
import { LabScreen } from '@/components/lab/LabScreen';
import { NodeModal } from '@/components/lab/NodeModal';
import { WhileAwayModal } from '@/components/lab/WhileAwayModal';
import { DiscoveriesScreen } from '@/components/screens/DiscoveriesScreen';
import { InventoryScreen } from '@/components/screens/InventoryScreen';
import { ShipmentsScreen } from '@/components/screens/ShipmentsScreen';
import { useAnimations } from '@/lib/useAnimations';
import { useTick } from '@/lib/useTick';
import { CHROME, SHELL_MAX_W } from '@/lib/tokens';
import { useGameStore } from '@/stores/gameStore';

const SCREEN_TITLES = {
  skills: 'Skills',
};

// Re-run offline sim every 30s while the app is open so shipment queues
// stay accurate during long sessions.
const PASSIVE_SIM_INTERVAL_MS = 30_000;

// Labels shown on the Lab floating shipment card.
const SHIPMENT_LABELS = {
  stabiliser: 'Stabiliser',
  ingredient: 'Ingredients',
  plasmaGel: 'Plasm/Gel',
};

export default function Home() {
  const [screen, setScreen] = useState('lab');
  const [modalNodeId, setModalNodeId] = useState(null);
  const tick = useTick();
  const { animations, fire } = useAnimations();

  const dishes = useGameStore((s) => s.dishes);
  const activeDishId = useGameStore((s) => s.activeDishId);
  const materials = useGameStore((s) => s.materials);
  const compounds = useGameStore((s) => s.compounds);
  const journal = useGameStore((s) => s.journal);
  const shipmentQueues = useGameStore((s) => s.shipmentQueues);
  const credits = useGameStore((s) => s.player.credits);
  const level = useGameStore((s) => s.player.level);
  const lastSummary = useGameStore((s) => s.lastSummary);

  const load = useGameStore((s) => s.load);
  const computeTimeDelta = useGameStore((s) => s.computeTimeDelta);
  const clearLastSummary = useGameStore((s) => s.clearLastSummary);
  const stabiliseNode = useGameStore((s) => s.stabiliseNode);
  const catalyseNode = useGameStore((s) => s.catalyseNode);
  const containNode = useGameStore((s) => s.containNode);
  const discardNode = useGameStore((s) => s.discardNode);
  const harvestNode = useGameStore((s) => s.harvestNode);
  const collectShipment = useGameStore((s) => s.collectShipment);

  // On mount: load saved state, then run offline sim once, then keep it
  // ticking passively. In-session collapses fire C1 live; long-gap collapses
  // go to the WhileAway modal via store.lastSummary.
  useEffect(() => {
    load();
    const runAndAnimate = () => {
      const summary = computeTimeDelta();
      if (summary?.inSession && summary.collapses?.length) {
        fire(summary.collapses.map((c) => ({ type: 'C1', nodeId: c.nodeId })));
      }
    };
    runAndAnimate();
    const id = setInterval(runAndAnimate, PASSIVE_SIM_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, computeTimeDelta, fire]);

  const activeDish = dishes.find((d) => d.id === activeDishId) ?? dishes[0];

  // Derive the live modal node from the store each render so that after an
  // action mutates state, the modal reflects the new stats.
  const modalNode =
    modalNodeId != null ? (activeDish.nodes.find((n) => n.id === modalNodeId) ?? null) : null;

  // Pick the first queue with a ready shipment to surface on the Lab card.
  const readyShipmentType = Object.keys(shipmentQueues).find(
    (t) => (shipmentQueues[t]?.count ?? 0) > 0
  );
  const readyShipment = readyShipmentType
    ? {
        type: readyShipmentType,
        label: SHIPMENT_LABELS[readyShipmentType] ?? readyShipmentType,
        qty: shipmentQueues[readyShipmentType].count,
      }
    : null;

  const goToScreen = (next) => {
    setScreen(next);
    setModalNodeId(null);
  };

  const handleNodeTap = (node) => {
    setModalNodeId((current) => (current === node.id ? null : node.id));
  };

  const handleAction = (actionId, node) => {
    const dishId = activeDish.id;
    const runner = {
      stabilise: stabiliseNode,
      catalyse: catalyseNode,
      contain: containNode,
      discard: discardNode,
      harvest: harvestNode,
    }[actionId];
    if (!runner) return;
    const result = runner(dishId, node.id);
    if (result?.ok && result.events?.length) fire(result.events);
    // Actions that spawn/consume the targeted node close the modal so the
    // player sees the result land rather than staring at a stale modal.
    if (actionId === 'catalyse' || actionId === 'discard' || actionId === 'harvest') {
      setModalNodeId(null);
    }
  };

  // `now` is recomputed each render, which combined with the 160ms tick
  // gives countdown labels a smooth refresh without a second timer.
  const now = Date.now();
  void tick; // subscribe the page to the shared tick so `now` advances

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
          {screen === 'lab' && (
            <LabScreen
              tick={tick}
              dish={activeDish}
              animations={animations}
              level={level}
              xpPercent={0}
              shipmentReady={readyShipment}
              onNodeTap={handleNodeTap}
              onCollectShipment={() => readyShipment && collectShipment(readyShipment.type)}
            />
          )}
          {screen === 'shipments' && (
            <ShipmentsScreen
              queues={shipmentQueues}
              materials={materials}
              now={now}
              onCollect={collectShipment}
            />
          )}
          {screen === 'inventory' && (
            <InventoryScreen compounds={compounds} materials={materials} credits={credits} />
          )}
          {screen === 'discoveries' && <DiscoveriesScreen journal={journal} />}
          {screen === 'skills' && (
            <ScreenPlaceholder title={SCREEN_TITLES[screen]} note="Pass 3 · skill trees" />
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

        {lastSummary && <WhileAwayModal summary={lastSummary} onClose={clearLastSummary} />}
      </div>
    </div>
  );
}
