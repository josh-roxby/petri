/**
 * Ambient floating particles. 7 dots drifting across the top third of the
 * shell to reinforce the "contained environment" feeling.
 *
 * Reference: proto-concepts/petri-design.md §3.4.
 */
const COUNT = 7;

export function Particles({ tick }) {
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => {
        const opacity = 0.1 + Math.sin(tick * 0.04 + i) * 0.09;
        const top = 14 + Math.sin(tick * 0.03 + i) * 12;
        const left = 8 + (i * 84) / COUNT;
        return (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              width: 1.5,
              height: 1.5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.45)',
              left: `${left}%`,
              top: `${top}%`,
              opacity: Math.max(0, opacity),
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        );
      })}
    </>
  );
}
