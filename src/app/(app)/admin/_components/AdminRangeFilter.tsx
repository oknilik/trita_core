import Link from "next/link";

// Időszak-szűrő a Vezérlőhöz — link-alapú (szerver-render, nincs kliens-
// állapot): ?tab=overview&range=…  A szűrő a chartokat és az időszak-
// összegzőt vezérli; az össz-KPI kártyák all-time számok maradnak.

export type AdminRange = "7d" | "30d" | "90d" | "all";

export const ADMIN_RANGES: { id: AdminRange; label: string }[] = [
  { id: "7d", label: "7 nap" },
  { id: "30d", label: "30 nap" },
  { id: "90d", label: "90 nap" },
  { id: "all", label: "Teljes időszak" },
];

export function isAdminRange(v: string | undefined): v is AdminRange {
  return v === "7d" || v === "30d" || v === "90d" || v === "all";
}

export function AdminRangeFilter({ active }: { active: AdminRange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-sand bg-white p-1">
      {ADMIN_RANGES.map((r) => (
        <Link
          key={r.id}
          href={`/admin?tab=overview&range=${r.id}`}
          aria-current={active === r.id ? "true" : undefined}
          className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
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
