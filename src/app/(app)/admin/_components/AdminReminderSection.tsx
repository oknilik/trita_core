"use client";

import { useState } from "react";

interface ReminderInvitation {
  id: string;
  observerEmail: string;
  observerName: string | null;
  createdAt: string;
  reminderCount: number;
  lastReminderSentAt: string | null;
  inviter: { username: string | null; email: string };
  completedMeanwhile?: boolean;
}

interface Props {
  invitations: ReminderInvitation[];
}

interface RowState {
  sending: boolean;
  sentAt: string | null;
  error: string | null;
  completed: boolean; // observer filled it out since page was loaded
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

function isRecentlyReminded(inv: ReminderInvitation): boolean {
  if (!inv.lastReminderSentAt) return false;
  return daysSince(inv.lastReminderSentAt) < 3;
}

export function AdminReminderSection({ invitations }: Props) {
  const [onlyActive, setOnlyActive] = useState(true);
  const [page, setPage] = useState(0);

  const visibleInvitations = onlyActive
    ? invitations.filter((inv) => inv.completedMeanwhile || !isRecentlyReminded(inv))
    : invitations;

  const totalPages = Math.ceil(visibleInvitations.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageInvitations = visibleInvitations.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(invitations.map((inv) => [inv.id, !isRecentlyReminded(inv) && !inv.completedMeanwhile]))
  );
  const [selectAll, setSelectAll] = useState(false);
  const [states, setStates] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const inv of invitations) {
      if (inv.completedMeanwhile) {
        initial[inv.id] = { sending: false, sentAt: null, error: null, completed: true };
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
    const pageIds = pageInvitations.map((inv) => inv.id);
    setChecked((prev) => {
      const next = { ...prev };
      for (const id of pageIds) next[id] = val;
      return next;
    });
  }

  function toggleRow(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allChecked = pageInvitations.every((inv) => next[inv.id]);
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
      const res = await fetch(`/api/admin/send-reminder/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const isCompleted = data.error === "Invitation is not pending";
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
    for (const inv of visibleInvitations) {
      if (!checked[inv.id]) continue;
      const s = getState(inv.id);
      if (s.sentAt || s.completed) continue;
      await sendReminder(inv.id);
    }
    setBulkRunning(false);
  }

  const checkedCount = visibleInvitations.filter((inv) => {
    const s = getState(inv.id);
    return checked[inv.id] && !s.sentAt && !s.completed;
  }).length;
  const activeCount = invitations.filter((inv) => !isRecentlyReminded(inv) && !inv.completedMeanwhile).length;

  if (invitations.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900">Emlékeztető küldés</h2>
        <p className="mt-4 text-sm text-gray-500">Nincs 3+ napja kitöltetlen emailes meghívó.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emlékeztető küldés</h2>
          <p className="mt-1 text-sm text-gray-500">
            3+ napja kitöltetlen emailes meghívók ({invitations.length} db · {activeCount} kiküldendő)
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
              {onlyActive ? activeCount : invitations.length}
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
              <th className="pb-3 pr-4">Observer</th>
              <th className="pb-3 pr-4">Meghívó</th>
              <th className="pb-3 pr-4">Kor</th>
              <th className="pb-3 pr-4">Utolsó emlékeztető</th>
              <th className="pb-3 pr-4">Db</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageInvitations.map((inv) => {
              const s = getState(inv.id);
              const sent = s.sentAt !== null;
              const recent = isRecentlyReminded(inv);
              const isChecked = !!checked[inv.id];
              const isInactive = s.completed || (recent && !isChecked);
              return (
                <tr
                  key={inv.id}
                  className={`transition-colors ${s.completed ? "bg-gray-50 opacity-60" : isInactive ? "opacity-50" : ""}`}
                >
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={isChecked && !s.completed}
                      disabled={s.completed}
                      onChange={() => !s.completed && toggleRow(inv.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-default"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className={`font-medium ${s.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {inv.observerEmail}
                        </p>
                        {inv.observerName && (
                          <p className="text-xs text-gray-400">{inv.observerName}</p>
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
                  <td className="py-3 pr-4 text-gray-600">
                    {inv.inviter.username ?? inv.inviter.email}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{daysSince(inv.createdAt)} napja</td>
                  <td className="py-3 pr-4 text-gray-500">
                    {s.sentAt
                      ? `${relativeTime(s.sentAt)} (most)`
                      : inv.lastReminderSentAt
                        ? relativeTime(inv.lastReminderSentAt)
                        : "–"}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    {inv.reminderCount + (sent ? 1 : 0)}
                  </td>
                  <td className="py-3">
                    {s.error && <p className="text-xs text-red-500 mb-1">{s.error}</p>}
                    <button
                      onClick={() => sendReminder(inv.id)}
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
            {safePage + 1} / {totalPages} oldal · {visibleInvitations.length} sor
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
