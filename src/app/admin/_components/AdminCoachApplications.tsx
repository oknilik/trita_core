"use client";

import { useState } from "react";

type Application = {
  id: string;
  name: string;
  email: string;
  background: string;
  motivation: string;
  specializations: string | null;
  status: string;
  createdAt: string;
  userProfileId: string | null;
};

export function AdminCoachApplications({ applications: initial }: { applications: Application[] }) {
  const [applications, setApplications] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "reject") {
    setLoading(`${id}-${action}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coach-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Hiba történt");
        return;
      }
      setApplications((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: action === "approve" ? "APPROVED" : "REJECTED" } : a
        )
      );
    } catch {
      setError("Hálózati hiba");
    } finally {
      setLoading(null);
    }
  }

  if (applications.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">Nincs beérkezett kérelem.</p>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "APPROVED") return "bg-green-100 text-green-700";
    if (status === "REJECTED") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const statusLabel = (status: string) => {
    if (status === "APPROVED") return "Jóváhagyva";
    if (status === "REJECTED") return "Elutasítva";
    return "Függőben";
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {applications.map((app) => (
        <div key={app.id} className="rounded-xl border border-gray-100 bg-white">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{app.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(app.status)}`}>
                  {statusLabel(app.status)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {app.email}
                {app.specializations && ` · ${app.specializations}`}
                {" · "}
                {new Date(app.createdAt).toLocaleDateString("hu-HU")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                className="min-h-[36px] rounded-lg border border-gray-100 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                {expanded === app.id ? "Bezár" : "Részletek"}
              </button>
              {app.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    disabled={!!loading}
                    onClick={() => handleAction(app.id, "approve")}
                    className="min-h-[36px] rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading === `${app.id}-approve` ? "..." : "Jóváhagyás"}
                  </button>
                  <button
                    type="button"
                    disabled={!!loading}
                    onClick={() => handleAction(app.id, "reject")}
                    className="min-h-[36px] rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {loading === `${app.id}-reject` ? "..." : "Elutasítás"}
                  </button>
                </>
              )}
            </div>
          </div>

          {expanded === app.id && (
            <div className="border-t border-gray-100 px-4 pb-4 pt-3">
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Szakmai háttér
                </p>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {app.background}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Motiváció
                </p>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {app.motivation}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
