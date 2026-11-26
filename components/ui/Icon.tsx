import type { SVGProps } from "react";

/** Minimal line icon set, 20 px grid, 1.5 px stroke. Decorative by default. */
const paths = {
  arrowRight: <path d="M4 10h11m-4-4 4 4-4 4" />,
  arrowLeft: <path d="M16 10H5m4-4-4 4 4 4" />,
  close: <path d="m5 5 10 10M15 5 5 15" />,
  menu: <path d="M3 6h14M3 10h14M3 14h14" />,
  check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
  info: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9v4.5M10 6.5v.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10 3.5 17.5 16.5h-15L10 3.5Z" />
      <path d="M10 8.5v3.5M10 14v.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4l2.5 2" />
    </>
  ),
  pin: (
    <>
      <path d="M10 17.5s5.5-5 5.5-9.5a5.5 5.5 0 0 0-11 0c0 4.5 5.5 9.5 5.5 9.5Z" />
      <circle cx="10" cy="8" r="2" />
    </>
  ),
  upload: <path d="M10 13V3.5m-3.5 3.5L10 3.5 13.5 7M3.5 13v2.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13" />,
  download: <path d="M10 3.5V13m-3.5-3.5L10 13l3.5-3.5M3.5 13v2.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13" />,
  reset: <path d="M4 10a6 6 0 1 0 1.8-4.3M4 3.5v3h3" />,
  play: <path d="M6.5 4.5v11l9-5.5-9-5.5Z" />,
  pause: <path d="M7 4.5v11M13 4.5v11" />,
  layers: <path d="m10 3 7 4-7 4-7-4 7-4Zm-7 7 7 4 7-4M3 13l7 4 7-4" />,
  section: (
    <>
      <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
      <path d="M10 2v16" strokeDasharray="2 2" />
    </>
  ),
  explode: <path d="M10 2.5v4m0 7v4M2.5 10h4m7 0h4M5 5l2 2m6 6 2 2M15 5l-2 2m-6 6-2 2" />,
  scroll: (
    <>
      <rect x="6" y="2.5" width="8" height="15" rx="4" />
      <path d="M10 6v3" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.25" />
      <path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.3 4.3l1.4 1.4m8.6 8.6 1.4 1.4M4.3 15.7l1.4-1.4m8.6-8.6 1.4-1.4" />
    </>
  ),
  moon: <path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5Z" />,
  auto: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 2.75v14.5A7.25 7.25 0 0 0 10 2.75Z" fill="currentColor" />
    </>
  ),
  document: (
    <>
      <path d="M5.5 2.5h6l3 3v12h-9v-15Z" />
      <path d="M11.5 2.5v3h3M8 10h4.5M8 13h4.5" />
    </>
  ),
  cube: (
    <>
      <path d="m10 2.5 6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5L10 2.5Z" />
      <path d="M3.5 6.25 10 10l6.5-3.75M10 10v7.5" />
    </>
  ),
  list: <path d="M7 5.5h10M7 10h10M7 14.5h10M3 5.5h.01M3 10h.01M3 14.5h.01" />,
  external: <path d="M8 4.5H4.5v11h11V12M11 3.5h5.5V9M16.5 3.5 9 11" />,
  minus: <path d="M4.5 10h11" />,
  plus: <path d="M10 4.5v11M4.5 10h11" />,
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13 13 4 4" />
    </>
  ),
  copy: (
    <>
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.5" />
      <path d="M13 7V4.5A1 1 0 0 0 12 3.5H4.5a1 1 0 0 0-1 1V12a1 1 0 0 0 1 1H7" />
    </>
  ),
  tray: <path d="M3 11.5 5 4.5h10l2 7m-14 0v4h14v-4m-14 0h4l1 2h4l1-2h4" />,
  factory: <path d="M2.5 16.5v-9l4.5 3v-3l4.5 3v-3l4.5 3v6h-13.5ZM6 13.5h1.5m2.5 0h1.5m2.5 0h1.5" />,
  printer: (
    <>
      <path d="M5.5 7.5v-4h9v4M5.5 14H3.5V8.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V14h-2" />
      <rect x="5.5" y="11.5" width="9" height="5" rx="0.5" />
    </>
  ),
  code: <path d="m7 6-4 4 4 4m6-8 4 4-4 4M11.5 4l-3 12" />,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, title, ...rest }: { name: IconName; size?: number; title?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}

/** Signal-style glyph for evidence tiers: filled bars equal the tier. No colour needed. */
export function TierGlyph({ tier, size = 14 }: { tier: 0 | 1 | 2 | 3; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1 + i * 4.5}
          y={9 - i * 3.5}
          width={3}
          height={4 + i * 3.5}
          rx={1}
          fill={i < tier ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1}
          opacity={i < tier ? 1 : 0.45}
        />
      ))}
    </svg>
  );
}
