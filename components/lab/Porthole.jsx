import { DISH_SIZE, PORTHOLE_BOLT } from '@/lib/tokens';

/**
 * Petri dish porthole frame. Wraps children in a circular clip so SVG shapes
 * (nodes) and full-circle fills (F1/F2 animations) stay inside the ring.
 *
 * Structure (back-to-front):
 *   outer ring · middle ring · 4 cardinal bolts · inner clip wrapper (children)
 *
 * Reference: proto-concepts/petri-design.md §3.2, petri-anim-spec.md §Porthole.
 */
export function Porthole({ children }) {
  const bolt = PORTHOLE_BOLT;
  return (
    <div style={{ position: 'relative', width: DISH_SIZE, height: DISH_SIZE }}>
      {/* outer ring */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -9,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 40px rgba(255,255,255,0.02), inset 0 0 30px rgba(0,0,0,0.6)',
        }}
      />
      {/* middle ring */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
      {/* 4 cardinal bolts */}
      {[0, 90, 180, 270].map((deg) => (
        <div
          key={deg}
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: bolt,
            height: bolt,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.16)',
            transform: `rotate(${deg}deg) translateX(${DISH_SIZE / 2 + 5}px) translateY(-${bolt / 2}px)`,
            transformOrigin: `0 ${bolt / 2}px`,
          }}
        />
      ))}
      {/* inner dish — overflow:hidden + border-radius:50% clips children to the circle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(12,12,12,0.85) 0%, rgba(4,4,4,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
