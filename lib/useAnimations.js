'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * One-shot animation state. Each animation carries:
 *   { id, type, nodeId?, startMs }
 *
 * A requestAnimationFrame loop re-renders the overlay at ~60fps only while
 * there are live animations. Game state itself still ticks on the shared
 * 160ms setInterval in useTick — this hook is purely for visual overlays.
 *
 * Reference: proto-concepts/petri-anim-spec.md (implementation notes).
 */

// Duration per animation type, in ms. Values taken from anim spec.
export const ANIM_DURATION_MS = {
  S1: 1500, // stable pulse rings
  S2: 1500, // stable diamond grid
  S3: 1500, // stable edge ripple
  C1: 1200, // collapse shockwave
  H1: 1000, // harvest particle burst
  SH1: 1200, // harvested stub fade
  T1: 600, // stabilise micro
  T2: 1000, // catalyse spark
  T3: 1200, // contain frost
  T4: 1000, // discard burn
  T5: 800, // store sale flash
};

let nextAnimId = 1;

export function useAnimations() {
  const [animations, setAnimations] = useState([]);
  const [, setFrame] = useState(0);
  const rafRef = useRef(null);
  const runningRef = useRef(false);

  // rAF loop — runs only while there's at least one live animation.
  const ensureLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    const tick = () => {
      const now = performance.now();
      setAnimations((current) => {
        const next = current.filter((a) => now - a.startMs < (ANIM_DURATION_MS[a.type] ?? 1000));
        // Stop the loop when no live animations remain.
        if (next.length === 0) {
          runningRef.current = false;
          return next;
        }
        return next;
      });
      setFrame((f) => (f + 1) & 0xffff);
      if (runningRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, []);

  /**
   * Fire a new animation. Accepts either a single event descriptor or a
   * list to enqueue simultaneously.
   *
   *   fire({ type: 'T1', nodeId: 3 })
   *   fire([{ type: 'S1', nodeId: 3 }, { type: 'S2', nodeId: 3 }])
   */
  const fire = useCallback(
    (eventOrEvents) => {
      const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
      if (events.length === 0) return;
      const startMs = performance.now();
      const additions = events
        .filter((e) => e && ANIM_DURATION_MS[e.type] != null)
        .map((e) => ({ id: nextAnimId++, startMs, ...e }));
      if (additions.length === 0) return;
      setAnimations((current) => [...current, ...additions]);
      ensureLoop();
    },
    [ensureLoop]
  );

  return { animations, fire };
}
