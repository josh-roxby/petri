import {
  BIO_FUEL_ITEM,
  dailyStoreSeed,
  dayKey,
  rollBuyInventory,
  rollSpecialOffer,
} from '@/lib/economy';

/**
 * Daily store rotation endpoint.
 *
 * In v1 the client re-derives today's seed locally from the UTC day key,
 * so this endpoint is not strictly required for gameplay. It exists for:
 *   - Vercel Cron to pre-warm the day (vercel.json hits it at 00:05 UTC)
 *   - The v2 backend (spec §12) which will cache + validate against it
 *   - Marketing pages that want to surface "today's offers" without
 *     embedding the client bundle.
 *
 * Returns the canonical seed + derived buy/special so every client agrees.
 */
export const dynamic = 'force-dynamic';

// Keep `BIO_FUEL_ITEM` referenced so tree-shaking doesn't drop it when
// future callers expect the buy list shape to include the fixed item.
void BIO_FUEL_ITEM;

export async function GET() {
  const now = Date.now();
  const seed = dailyStoreSeed(now);
  const day = dayKey(now);
  const buy = rollBuyInventory(seed);
  const special = rollSpecialOffer(seed);
  return Response.json(
    { day, seed, buy, special, generatedAt: new Date(now).toISOString() },
    {
      headers: {
        // Cache at the edge for up to the next day rollover.
        'Cache-Control': 'public, max-age=60, s-maxage=3600',
      },
    }
  );
}
