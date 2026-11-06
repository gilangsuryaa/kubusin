"use client";

type Point = readonly [number, number];

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Point inside a quad given as [topLeft, topRight, bottomRight, bottomLeft]. */
function at(quad: readonly Point[], u: number, v: number): Point {
  const top = lerp(quad[0], quad[1], u);
  const bottom = lerp(quad[3], quad[2], u);
  return lerp(top, bottom, v);
}

interface FaceProps {
  corners: readonly Point[];
  className: string;
}

/** One isometric face with a 3x3 sticker grid drawn from its own corners. */
function Face({ corners, className }: FaceProps) {
  const points = corners.map((point) => point.join(",")).join(" ");
  const lines = [1, 2].flatMap((step) => {
    const t = step / 3;
    return [
      [at(corners, t, 0), at(corners, t, 1)],
      [at(corners, 0, t), at(corners, 1, t)],
    ] as const;
  });

  return (
    <g>
      <polygon points={points} className={className} />
      {lines.map(([from, to], index) => (
        <line
          key={index}
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
          strokeWidth={1.4}
          className="stroke-line-strong/60"
        />
      ))}
    </g>
  );
}

/**
 * Lightweight stand-in for the WebGL canvas: a plain SVG cube painted during
 * the first render. It gives the hero a real painted element before three.js is
 * fetched and keeps the LCP away from WebGL startup, then disappears as soon as
 * the real scene mounts. Deliberately monochrome so it reads as a placeholder
 * rather than a fake solved cube.
 */
export function CubePoster() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="h-full w-full text-ink"
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx={100} cy={172} rx={62} ry={12} className="fill-ink/[0.06]" />
      <Face corners={[[100, 14], [178, 53], [100, 92], [22, 53]]} className="fill-ink/[0.10]" />
      <Face corners={[[22, 53], [100, 92], [100, 170], [22, 131]]} className="fill-ink/[0.07]" />
      <Face corners={[[100, 92], [178, 53], [178, 131], [100, 170]]} className="fill-ink/[0.13]" />
    </svg>
  );
}
