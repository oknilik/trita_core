// Közös stroke-ikonkészlet (UI-egységesítés — ikon-egységesítés).
// Konvenció: 20-as viewBox, 1.8 stroke, currentColor, kerek végek —
// megegyezik a nav és a tab-ikonok nyelvével. Új ikon IDE kerül, nem
// inline SVG-ként a komponensbe.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function base(props: IconProps) {
  return {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
    className: props.className ?? "h-4 w-4",
  };
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 12V3.5M6.5 6.5 10 3l3.5 3.5" />
      <path d="M4 10.5v5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-5" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11.5 2.5H6A1.5 1.5 0 0 0 4.5 4v12A1.5 1.5 0 0 0 6 17.5h8a1.5 1.5 0 0 0 1.5-1.5V6.5l-4-4Z" />
      <path d="M11.5 2.5v4h4M7.5 11h5M7.5 14h5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10.5l4 4 8-8" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3 2.8 16h14.4L10 3Z" />
      <path d="M10 7.5v4M10 14.2v.1" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4.5l3 1.8" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M11 3h6v6M9 11l8-8" />
      <path d="M15.5 11.5v4A1.5 1.5 0 0 1 14 17H4.5A1.5 1.5 0 0 1 3 15.5V6A1.5 1.5 0 0 1 4.5 4h4" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="m3 5.5 7 5.5 7-5.5" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="8.5" width="12" height="8.5" rx="2" />
      <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 12v2" />
    </svg>
  );
}

export function RoleClusterIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="5" r="2.5" />
      <circle cx="5" cy="14" r="2.5" />
      <circle cx="15" cy="14" r="2.5" />
      <path d="m8.7 7.2-2.4 4.5M11.3 7.2l2.4 4.5M7.5 14h5" />
    </svg>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="4" r="2" />
      <circle cx="4" cy="15" r="2" />
      <circle cx="16" cy="15" r="2" />
      <circle cx="10" cy="12" r="2" />
      <path d="m9 5.8-4 7.4M11 5.8l4 7.4M10 6v4M6 14.3l2.2-1.4M14 14.3l-2.2-1.4" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 2.5c.4 3.1 1.9 4.6 5 5-3.1.4-4.6 1.9-5 5-.4-3.1-1.9-4.6-5-5 3.1-.4 4.6-1.9 5-5Z" />
      <path d="M15.5 11.5c.2 1.8 1.1 2.7 3 3-1.9.3-2.8 1.2-3 3-.2-1.8-1.1-2.7-3-3 1.9-.3 2.8-1.2 3-3ZM4 2.5v3M2.5 4h3" />
    </svg>
  );
}
