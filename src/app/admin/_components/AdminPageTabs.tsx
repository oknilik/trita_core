"use client";

import { useState } from "react";

interface Props {
  overviewContent: React.ReactNode;
  remindersContent: React.ReactNode;
  reminderCount: number;
}

export function AdminPageTabs({ overviewContent, remindersContent, reminderCount }: Props) {
  const [tab, setTab] = useState<"overview" | "reminders">("overview");

  return (
    <>
      {/* Tab bar */}
      <div className="mt-6 flex gap-2 rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm w-fit">
        <button
          onClick={() => setTab("overview")}
          className={`flex min-h-[40px] items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-200 ${
            tab === "overview"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          📊 Áttekintés
        </button>
        <button
          onClick={() => setTab("reminders")}
          className={`flex min-h-[40px] items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-200 ${
            tab === "reminders"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          ✉️ Emlékeztetők
          {reminderCount > 0 && (
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                tab === "reminders"
                  ? "bg-white/25 text-white"
                  : "bg-rose-500 text-white"
              }`}
            >
              {reminderCount}
            </span>
          )}
        </button>
      </div>

      <div className={tab === "overview" ? "" : "hidden"}>
        {overviewContent}
      </div>
      <div className={tab === "reminders" ? "" : "hidden"}>
        {remindersContent}
      </div>
    </>
  );
}
