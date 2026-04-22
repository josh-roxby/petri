'use client';

import { useEffect, useState } from 'react';
import { TICK_MS } from './tokens';

/**
 * Shared animation tick. One instance per app root.
 * Pass the returned tick value down as a prop to animated children.
 *
 * Reference: proto-concepts/petri-ui-codebasis.md §7.
 */
export function useTick(intervalMs = TICK_MS) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
