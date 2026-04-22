import { ImageResponse } from 'next/og';

/**
 * iOS home-screen icon. Rendered to PNG on-demand by Next's ImageResponse
 * (Satori). 180×180 is the canonical apple-touch-icon size.
 *
 * Using ImageResponse avoids a build-time image toolchain — no sharp, no
 * raster pipeline, just JSX rendered to PNG at request time and then cached
 * at the edge.
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060606',
          position: 'relative',
        }}
      >
        {/* Outer porthole ring */}
        <div
          style={{
            position: 'absolute',
            width: 136,
            height: 136,
            borderRadius: 68,
            border: '3px solid rgba(255,255,255,0.2)',
          }}
        />
        {/* Inner dish */}
        <div
          style={{
            position: 'absolute',
            width: 122,
            height: 122,
            borderRadius: 61,
            background: '#0a0a0a',
          }}
        />
        {/* Cell — halo → core → hot white centre */}
        <div
          style={{
            position: 'absolute',
            width: 64,
            height: 64,
            borderRadius: 32,
            background: 'rgba(31,204,121,0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 42,
            height: 42,
            borderRadius: 21,
            background: 'rgba(31,204,121,0.55)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 18,
            height: 18,
            borderRadius: 9,
            background: 'rgba(255,255,255,0.95)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
