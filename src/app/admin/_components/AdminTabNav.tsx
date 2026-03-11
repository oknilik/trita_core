"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { id: "research", label: "Kutatás" },
  { id: "coach", label: "Coach" },
] as const;

export function AdminTabNav() {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "research";

  return (
    <div className="mb-8 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/admin?tab=${tab.id}`}
          className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
            active === tab.id
              ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-100"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
