"use client";

import { useState } from "react";

interface ShareDebriefButtonProps {
  cacheKey: string;
  existingToken: string | null;
  isHu: boolean;
}

export function ShareDebriefButton({ cacheKey, existingToken, isHu }: ShareDebriefButtonProps) {
  const [token, setToken] = useState<string | null>(existingToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`
    : null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/manager/output/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cacheKey }),
      });
      if (res.ok) {
        const { shareToken } = await res.json();
        setToken(shareToken);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="min-h-[44px] inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
      >
        {loading
          ? isHu ? "Generálás…" : "Generating…"
          : isHu ? "Megosztható link" : "Share link"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="truncate rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500 max-w-[200px] md:max-w-[300px]">
        {typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : `/share/${token}`}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="min-h-[44px] shrink-0 inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
      >
        {copied ? (isHu ? "Másolva ✓" : "Copied ✓") : (isHu ? "Másolás" : "Copy")}
      </button>
    </div>
  );
}
