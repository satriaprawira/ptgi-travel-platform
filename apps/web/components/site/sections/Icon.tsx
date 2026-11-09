import type { ReactNode } from "react";

// Outline icons for the customer pages, one stroke style (1.75) for all.

const PLANE =
  "M12 2.5c.9 0 1.5.9 1.5 2v5l7.5 4.2v2l-7.5-2.2v4.3l2.2 1.7v1.6L12 20.2l-3.7.9v-1.6l2.2-1.7v-4.3L3 15.7v-2l7.5-4.2v-5c0-1.1.6-2 1.5-2z";

/** A plane over a ground line, tilted down (landing) or up (taking off). */
function flight(angle: number) {
  return (
    <>
      <path d="M3 21.5h18" />
      <path
        vectorEffect="non-scaling-stroke"
        transform={`translate(12 10.5) rotate(${angle}) scale(0.72) translate(-12 -11.8)`}
        d={PLANE}
      />
    </>
  );
}

const ICONS = {
  "plane-landing": flight(135),
  "plane-takeoff": flight(45),
  plane: <path d={PLANE} />,
  car: (
    <>
      <path d="M3 16v-3.2c0-.6.3-1.1.8-1.4L6.5 6.8A2 2 0 0 1 8.2 6h7.6a2 2 0 0 1 1.7.8l2.7 4.6c.5.3.8.8.8 1.4V16a1 1 0 0 1-1 1h-1M5 17H4a1 1 0 0 1-1-1M9.5 17h5M4 11.5h16" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  map: <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20" />,
  group: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.8.7 3 2.6 3 5.2" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" />
    </>
  ),
  sign: (
    <>
      <rect x="3" y="4.5" width="18" height="11" rx="2" />
      <path d="M7 9h10M7 12h6M12 15.5v4M9 19.5h6" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z" />
      <path d="M17 8.5a5 5 0 0 1 0 7" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  seat: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  bag: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M9 11v5M15 11v5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  chevron: <path d="M6 9l6 6 6-6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
