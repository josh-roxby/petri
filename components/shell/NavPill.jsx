import { CHROME, MONO, NAV_BOTTOM, NAV_H, NAV_RADIUS, NAV_WIDTH, Z } from '@/lib/tokens';

/**
 * Floating bottom nav pill — 5 items, Lab centred as the elevated primary.
 * Always visible. Position absolute so it never participates in screen layout.
 *
 * Reference: proto-concepts/petri-spec.md §17, petri-ui-codebasis.md §11.
 */
const ITEMS = [
  { id: 'inventory', ic: '◈', lb: 'Inventory' },
  { id: 'shipments', ic: '▣', lb: 'Shipments' },
  { id: 'lab', ic: '◉', lb: null, primary: true },
  { id: 'discoveries', ic: '◎', lb: 'Discover' },
  { id: 'skills', ic: '⬡', lb: 'Skills' },
];

export function NavPill({ active, onChange }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: NAV_BOTTOM,
        left: '50%',
        transform: 'translateX(-50%)',
        width: NAV_WIDTH,
        height: NAV_H,
        background: CHROME.bgSurface,
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRadius: NAV_RADIUS,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.98)',
        zIndex: Z.nav,
      }}
    >
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-label={item.lb ?? 'Lab'}
            aria-pressed={isActive}
            style={
              item.primary
                ? {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: '#fff',
                    boxShadow: '0 0 20px rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }
                : {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '4px 2px',
                  }
            }
          >
            <span
              style={{
                fontSize: item.primary ? 17 : 13,
                color: item.primary
                  ? CHROME.bg
                  : isActive
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.26)',
                lineHeight: 1,
              }}
            >
              {item.ic}
            </span>
            {!item.primary && (
              <span
                style={{
                  fontSize: 6,
                  color: isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)',
                  fontFamily: MONO,
                  letterSpacing: 0.2,
                }}
              >
                {item.lb}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
