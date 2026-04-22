/**
 * White geometric SVG icon for materials. Sharp, square-oriented — visually
 * distinct from the organic blob language of compounds.
 *
 * Reference: proto-concepts/petri-design.md §10, petri-ui-codebasis.md §12.
 */
const SHAPES = {
  diamond: ({ h, q, base }) => (
    <polygon
      points={`${h},${q * 0.55} ${h * 2 - q * 0.55},${h} ${h},${h * 2 - q * 0.55} ${q * 0.55},${h}`}
      {...base}
    />
  ),
  hex: ({ h, base }) => (
    <polygon
      points={[0, 1, 2, 3, 4, 5]
        .map((i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          return `${(h + h * 0.72 * Math.cos(a)).toFixed(1)},${(h + h * 0.72 * Math.sin(a)).toFixed(1)}`;
        })
        .join(' ')}
      {...base}
    />
  ),
  nested: ({ h, q, base }) => (
    <>
      <rect x={q * 0.4} y={q * 0.4} width={h * 1.6} height={h * 1.6} rx={1.5} {...base} />
      <rect
        x={q * 1.1}
        y={q * 1.1}
        width={h * 0.6}
        height={h * 0.6}
        rx={1}
        fill="white"
        stroke="none"
        opacity={0.5}
      />
    </>
  ),
  triangle: ({ s, h, q, base }) => (
    <polygon
      points={`${h},${q * 0.5} ${s - q * 0.5},${s - q * 0.55} ${q * 0.5},${s - q * 0.55}`}
      {...base}
    />
  ),
  cross: ({ s, h, q, base }) => (
    <>
      <line x1={h} y1={q * 0.55} x2={h} y2={s - q * 0.55} {...base} />
      <line x1={q * 0.55} y1={h} x2={s - q * 0.55} y2={h} {...base} />
    </>
  ),
  pill: ({ h, q, base }) => (
    <rect x={q * 0.7} y={q * 0.32} width={h * 0.85} height={h * 1.35} rx={h * 0.42} {...base} />
  ),
};

export function GeomIcon({ shape, size = 28, opacity = 0.65 }) {
  const s = size;
  const h = s / 2;
  const q = s / 4;
  const base = {
    stroke: 'white',
    strokeWidth: 1.5,
    fill: 'none',
    strokeLinecap: 'square',
    strokeLinejoin: 'miter',
  };
  const render = SHAPES[shape];
  if (!render) return null;
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{ display: 'block', flexShrink: 0, opacity }}
    >
      {render({ s, h, q, base })}
    </svg>
  );
}
