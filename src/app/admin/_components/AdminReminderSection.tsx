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
}

interface Props {
  invitations: ReminderInvitation[];
}

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
  // Default: auto-eligible rows (no recent reminder) are checked
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(invitations.map((inv) => [inv.id, !isRecentlyReminded(inv)]))
  );
  const [selectAll, setSelectAll] = useState(false);
  const [states, setStates] = useState<
    Record<string, { sending: boolean; sentAt: string | null; error: string | null }>
  >({});
  const [bulkRunning, setBulkRunning] = useState(false);

  function getState(id: string) {
    return states[id] ?? { sending: false, sentAt: null, error: null };
  }

  function handleSelectAll(val: boolean) {
    setSelectAll(val);
    if (val) {
      setChecked(Object.fromEntries(invitations.map((inv) => [inv.id, true])));
    } else {
      // revert to default (only auto-eligible)
      setChecked(Object.fromEntries(invitations.map((inv) => [inv.id, !isRecentlyReminded(inv)])));
    }
  }

  function toggleRow(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // sync selectAll state
      const allChecked = invitations.every((inv) => next[inv.id]);
      setSelectAll(allChecked);
      return next;
    });
  }

  async function sendReminder(id: string) {
    setStates((prev) => ({
      ...prev,
      [id]: { sending: true, sentAt: null, error: null },
    }));
    try {
      const res = await fetch(`/api/admin/send-reminder/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hiba történt");
      setStates((prev) => ({
        ...prev,
        [id]: { sending: false, sentAt: data.sentAt, error: null },
      }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [id]: { sending: false, sentAt: null, error: (err as Error).message },
      }));
    }
  }

  async function sendChecked() {
    setBulkRunning(true);
    for (const inv of invitations) {
      if (!checked[inv.id]) continue;
      const s = getState(inv.id);
      if (s.sentAt) continue;
      await sendReminder(inv.id);
    }
    setBulkRunning(false);
  }

  const checkedCount = invitations.filter((inv) => checked[inv.id]).length;

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emlékeztető küldés</h2>
          <p className="mt-1 text-sm text-gray-500">
            3+ napja kitöltetlen emailes meghívók ({invitations.length} db)
          </p>
        </div>
        <button
          onClick={sendChecked}
          disabled={bulkRunning || checkedCount === 0}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {bulkRunning ? "Küldés…" : `Kijelöltek küldése (${checkedCount})`}
        </button>
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
            {invitations.map((inv) => {
              const s = getState(inv.id);
              const sent = s.sentAt !== null;
              const recent = isRecentlyReminded(inv);
              const isChecked = !!checked[inv.id];
              return (
                <tr
                  key={inv.id}
                  className={`transition-colors ${recent && !isChecked ? "opacity-50" : ""}`}
                >
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRow(inv.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-gray-800">{inv.observerEmail}</p>
                        {inv.observerName && (
                          <p className="text-xs text-gray-400">{inv.observerName}</p>
                        )}
                      </div>
                      {recent && (
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
                    {s.error && (
                      <p className="text-xs text-red-500 mb-1">{s.error}</p>
                    )}
                    <button
                      onClick={() => sendReminder(inv.id)}
                      disabled={s.sending || sent}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        sent
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : s.sending
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      {sent ? "Elküldve ✓" : s.sending ? "Küldés…" : "Küldés"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
