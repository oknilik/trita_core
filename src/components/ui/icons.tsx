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
