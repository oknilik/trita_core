"use client";

import { useState } from "react";

interface IncompleteDraft {
  id: string;
  email: string;
  username: string | null;
  testType: string;
  answeredCount: number;
  totalCount: number;
  updatedAt: string;
  draftReminderCount: number;
  lastDraftReminderSentAt: string | null;
  completedMeanwhile?: boolean;
}

interface Props {
  drafts: IncompleteDraft[];
}

interface RowState {
  sending: boolean;
  sentAt: string | null;
  error: string | null;
  completed: boolean; // user finished the test since the page was loaded
}

const PAGE_SIZE = 10;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} perce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} órája`;
  return `${Math.floor(hours / 24)} napja`;
}

function isRecentlyReminded(draft: IncompleteDraft): boolean {
  if (!draft.lastDraftReminderSentAt) return false;
  return daysSince(draft.lastDraftReminderSentAt) < 3;
}

export function AdminDraftReminderSection({ drafts }: Props) {
  const [onlyActive, setOnlyActive] = useState(true);
  const [page, setPage] = useState(0);

  const visibleDrafts = onlyActive
    ? drafts.filter((d) => d.completedMeanwhile || !isRecentlyReminded(d))
    : drafts;

  const totalPages = Math.ceil(visibleDrafts.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageDrafts = visibleDrafts.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(drafts.map((d) => [d.id, !isRecentlyReminded(d) && !d.completedMeanwhile]))
  );
  const [selectAll, setSelectAll] = useState(false);
  const [states, setStates] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const d of drafts) {
      if (d.completedMeanwhile) {
        initial[d.id] = { sending: false, sentAt: null, error: null, completed: true };
      }
    }
    return initial;
  });
  const [bulkRunning, setBulkRunning] = useState(false);

  function getState(id: string): RowState {
    return states[id] ?? { sending: false, sentAt: null, error: null, completed: false };
  }

  function handleSelectAll(val: boolean) {
    setSelectAll(val);
    // selectAll operates on the current page only
    const pageIds = pageDrafts.map((d) => d.id);
    setChecked((prev) => {
      const next = { ...prev };
      for (const id of pageIds) next[id] = val;
      return next;
    });
  }

  function toggleRow(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allChecked = pageDrafts.every((d) => next[d.id]);
      setSelectAll(allChecked);
      return next;
    });
  }

  function goToPage(p: number) {
    setPage(p);
    setSelectAll(false);
  }

  async function sendReminder(id: string) {
    setStates((prev) => ({ ...prev, [id]: { ...getState(id), sending: true, error: null } }));
    try {
      const res = await fetch(`/api/admin/send-draft-reminder/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const isCompleted = data.error === "User already completed assessment";
        setStates((prev) => ({
          ...prev,
          [id]: { sending: false, sentAt: null, error: isCompleted ? null : (data.error ?? "Hiba történt"), completed: isCompleted },
        }));
        return;
      }
      setStates((prev) => ({ ...prev, [id]: { sending: false, sentAt: data.sentAt, error: null, completed: false } }));
    } catch (err) {
      setStates((prev) => ({ ...prev, [id]: { sending: false, sentAt: null, error: (err as Error).message, completed: false } }));
    }
  }

  async function sendChecked() {
    setBulkRunning(true);
    // Send across all visible pages, not just current
    for (const d of visibleDrafts) {
      if (!checked[d.id]) continue;
      const s = getState(d.id);
      if (s.sentAt || s.completed) continue;
      await sendReminder(d.id);
    }
    setBulkRunning(false);
  }

  const checkedCount = visibleDrafts.filter((d) => {
    const s = getState(d.id);
    return checked[d.id] && !s.sentAt && !s.completed;
  }).length;
  const activeCount = drafts.filter((d) => !isRecentlyReminded(d) && !d.completedMeanwhile).length;

  if (drafts.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900">Félbehagyott tesztek</h2>
        <p className="mt-4 text-sm text-gray-500">Nincs 1+ napja félbehagyott teszt.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Félbehagyott tesztek</h2>
          <p className="mt-1 text-sm text-gray-500">
            1+ napja félbehagyott kitöltők ({drafts.length} db · {activeCount} kiküldendő)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setOnlyActive((v) => !v); setSelectAll(false); setPage(0); }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              onlyActive
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {onlyActive ? "Csak kiküldendők" : "Összes"}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${onlyActive ? "bg-indigo-200 text-indigo-800" : "bg-gray-100 text-gray-500"}`}>
              {onlyActive ? activeCount : drafts.length}
            </span>
          </button>
          <button
            onClick={sendChecked}
            disabled={bulkRunning || checkedCount === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {bulkRunning ? "Küldés…" : `Kijelöltek küldése (${checkedCount})`}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="pb-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="pb-3 pr-4">Felhasználó</th>
              <th className="pb-3 pr-4">Teszt</th>
              <th className="pb-3 pr-4">Haladás</th>
              <th className="pb-3 pr-4">Utolsó aktivitás</th>
              <th className="pb-3 pr-4">Utolsó emlékeztető</th>
              <th className="pb-3 pr-4">Db</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageDrafts.map((draft) => {
              const s = getState(draft.id);
              const sent = s.sentAt !== null;
              const recent = isRecentlyReminded(draft);
              const isChecked = !!checked[draft.id];
              const pct = draft.totalCount > 0 ? Math.round((draft.answeredCount / draft.totalCount) * 100) : 0;
              const isInactive = s.completed || (recent && !isChecked);
              return (
                <tr
                  key={draft.id}
                  className={`transition-colors ${s.completed ? "bg-gray-50 opacity-60" : isInactive ? "opacity-50" : ""}`}
                >
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={isChecked && !s.completed}
                      disabled={s.completed}
                      onChange={() => !s.completed && toggleRow(draft.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-default"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className={`font-medium ${s.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {draft.email}
                        </p>
                        {draft.username && (
                          <p className="text-xs text-gray-400">{draft.username}</p>
                        )}
                      </div>
                      {s.completed && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Kész ✓
                        </span>
                      )}
                      {!s.completed && recent && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Friss
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 text-xs font-medium">{draft.testType}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${s.completed ? "bg-emerald-400" : "bg-indigo-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {draft.answeredCount}/{draft.totalCount}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{relativeTime(draft.updatedAt)}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {s.sentAt
                      ? `${relativeTime(s.sentAt)} (most)`
                      : draft.lastDraftReminderSentAt
                        ? relativeTime(draft.lastDraftReminderSentAt)
                        : "–"}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {draft.draftReminderCount + (sent ? 1 : 0)}
                  </td>
                  <td className="py-3">
                    {s.error && <p className="text-xs text-red-500 mb-1">{s.error}</p>}
                    <button
                      onClick={() => sendReminder(draft.id)}
                      disabled={s.sending || sent || s.completed}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        s.completed
                          ? "bg-gray-100 text-gray-400 cursor-default"
                          : sent
                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                            : s.sending
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      {s.completed ? "Már kész" : sent ? "Elküldve ✓" : s.sending ? "Küldés…" : "Küldés"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            {safePage + 1} / {totalPages} oldal · {visibleDrafts.length} sor
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 0}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Előző
            </button>
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Következő →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
