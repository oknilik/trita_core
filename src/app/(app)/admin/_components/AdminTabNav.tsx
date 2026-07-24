"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// 5 fő fül (2026-07-22 racionalizálás): Vezérlő · Kérdések · Szervezetek ·
// Tanácsadók · Működés. A feedback/reminders nézetek a Működés gyűjtőfül
// alól nyílnak (mélylinkjeik változatlanul élnek — ilyenkor a Működés aktív).
// A Kutatás fül megszűnt; az elégedettség-aggregátumok a Visszajelzésekre
// költöztek.
const TABS = [
  { id: "overview", label: "Vezérlő" },
  { id: "inquiries", label: "Kérdések" },
  { id: "orgs", label: "Szervezetek" },
  { id: "consultants", label: "Tanácsadók" },
  { id: "blog", label: "Blog" },
  { id: "ops", label: "Működés" },
] as const;

const OPS_SUBTABS = new Set(["ops", "feedback", "reminders"]);

export function AdminTabNav() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab") ?? "overview";
  const active = OPS_SUBTABS.has(raw) ? "ops" : raw;

  return (
    <div className="mt-6 mb-8 flex gap-1 rounded-xl border border-sand bg-cream p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/admin?tab=${tab.id}`}
          className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
            active === tab.id
              ? "bg-white text-bronze shadow-sm ring-1 ring-sand"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
