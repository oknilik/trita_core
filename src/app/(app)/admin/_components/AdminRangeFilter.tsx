import Link from "next/link";

// Időszak- és szegmens-szűrő a Vezérlőhöz — link-alapú (szerver-render):
// ?tab=overview&range=…&seg=…  A szűrők a trend-chartot és az időszak-
// összegzőt vezérlik; az össz-KPI kártyák all-time számok maradnak.

export type AdminRange = "7d" | "30d" | "90d" | "all";
export type AdminSegment = "all" | "self" | "org";

export const ADMIN_RANGES: { id: AdminRange; label: string }[] = [
  { id: "7d", label: "7 nap" },
  { id: "30d", label: "30 nap" },
  { id: "90d", label: "90 nap" },
  { id: "all", label: "Teljes időszak" },
];

const ADMIN_SEGMENTS: { id: AdminSegment; label: string }[] = [
  { id: "all", label: "Összes" },
  { id: "self", label: "Self" },
  { id: "org", label: "Szervezeti" },
];

export function isAdminRange(v: string | undefined): v is AdminRange {
  return v === "7d" || v === "30d" || v === "90d" || v === "all";
}

export function isAdminSegment(v: string | undefined): v is AdminSegment {
  return v === "all" || v === "self" || v === "org";
}

function href(range: AdminRange, seg: AdminSegment) {
  return `/admin?tab=overview&range=${range}&seg=${seg}`;
}

function Pills<T extends string>({
  items,
  active,
  makeHref,
}: {
  items: { id: T; label: string }[];
  active: T;
  makeHref: (id: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-sand bg-white p-1">
      {items.map((r) => (
        <Link
          key={r.id}
          href={makeHref(r.id)}
          // Szűrő-váltás ne ugorjon az oldal tetejére — a görgetési
          // pozíció marad, csak a chart-adat frissül.
          scroll={false}
          aria-current={active === r.id ? "true" : undefined}
          className={`inline-flex min-h-[40px] items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            active === r.id
              ? "bg-ink text-white shadow-sm"
              : "text-muted hover:bg-cream hover:text-ink"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}

export function AdminRangeFilter({
  active,
  segment,
}: {
  active: AdminRange;
  segment: AdminSegment;
}) {
  return (
    <Pills items={ADMIN_RANGES} active={active} makeHref={(id) => href(id, segment)} />
  );
}

/** Kohorsz-váltó: Összes / Self (nincs org-tagság) / Szervezeti (aktív org-tag). */
export function AdminSegmentFilter({
  active,
  range,
}: {
  active: AdminSegment;
  range: AdminRange;
}) {
  return (
    <Pills items={ADMIN_SEGMENTS} active={active} makeHref={(id) => href(range, id)} />
  );
}
