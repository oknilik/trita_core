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

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

export function HelpCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.9 7.3A2.25 2.25 0 0 1 10.1 5c1.35 0 2.4.85 2.4 2.05 0 1.45-1.15 1.9-2.05 2.55-.55.4-.7.85-.7 1.45M9.75 14.35v.05" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8h14v9H3zM2.5 5.5h15V8h-15zM10 5.5V17" />
      <path d="M9.8 5.4C8 5.4 6.4 4.7 6.4 3.6c0-.8.6-1.3 1.4-1.3 1.3 0 2 1.5 2 3.1ZM10.2 5.4c1.8 0 3.4-.7 3.4-1.8 0-.8-.6-1.3-1.4-1.3-1.3 0-2 1.5-2 3.1Z" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 3v14M10 3v14M16 3v14" />
      <path d="M2 7h4M8 13h4M14 9h4" />
      <circle cx="4" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 17V9M8 17V5M13 17v-7M18 17V3" />
      <path d="M2 17.5h17" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

export function UserPlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="6.5" r="3" />
      <path d="M2.5 17c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5M15.5 7v6M12.5 10h6" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 18V3M4 4h10l-1.5 3L14 10H4" />
    </svg>
  );
}

export function SupportChatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 3.5h9A2.5 2.5 0 0 1 17 6v6.5a2.5 2.5 0 0 1-2.5 2.5H9l-4.5 2v-2.5A2.5 2.5 0 0 1 3 12.2V6a2.5 2.5 0 0 1 2.5-2.5Z" />
      <path d="M10 6.2c.2 1.7 1.1 2.6 2.8 2.8-1.7.2-2.6 1.1-2.8 2.8-.2-1.7-1.1-2.6-2.8-2.8 1.7-.2 2.6-1.1 2.8-2.8Z" />
    </svg>
  );
}
