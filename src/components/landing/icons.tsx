// Vonalas ikon-készlet a landing emoji-i helyett (design-akciólista #6).
// Egységes SVG-stílus: 16-os viewBox, currentColor stroke,
// 1.5 vonalvastagság. Mindig aria-hidden — a jelentést a kísérő szöveg adja.

type IconProps = { className?: string };

function base(className?: string) {
  return {
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": true as const,
    className,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.3 1.6" />
    </svg>
  );
}

export function FlaskIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6.5 2h3M7 2v4.2L3.4 12a1.6 1.6 0 0 0 1.4 2.4h6.4a1.6 1.6 0 0 0 1.4-2.4L9 6.2V2" />
      <path d="M5 10.5h6" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M8.8 1.5 3.5 9h3.2l-.9 5.5L11.5 7H8.3l.5-5.5Z" />
    </svg>
  );
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="2.5" y="5.5" width="11" height="3" rx="0.8" />
      <path d="M3.5 8.5v4.5A1.5 1.5 0 0 0 5 14.5h6a1.5 1.5 0 0 0 1.5-1.5V8.5M8 5.5v9M8 5.5S6 5.5 5 4.6a1.4 1.4 0 0 1 2-2c.9 1 1 2.9 1 2.9Zm0 0s2 0 3-.9a1.4 1.4 0 0 0-2-2c-.9 1-1 2.9-1 2.9Z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m3 8.5 3.2 3L13 4.5" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="8" cy="8" r="6" />
      <path d="m10.5 5.5-1.6 3.4L5.5 10.5l1.6-3.4 3.4-1.6Z" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M14 10a1.5 1.5 0 0 1-1.5 1.5H8l-3 3v-3H3.5A1.5 1.5 0 0 1 2 10V4a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 14 4v6Z" />
      <path d="M5.5 6h5M5.5 8.5H9" />
    </svg>
  );
}

export function NodesIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="4" cy="4" r="1.8" />
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="7" cy="12" r="1.8" />
      <path d="M5.7 4.4 10.2 5M5 10.4 4.4 5.8M8.4 10.9l2.7-4.2" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8Z" />
      <circle cx="8" cy="8" r="1.9" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </svg>
  );
}
