"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives/Card";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";
import {
  ORG_BILLING_FIELDS,
  type OrgBillingProfile,
} from "@/lib/org-billing";

// Tanácsadói ügyfél-org létrehozó űrlap. A POST /api/org asConsultant ágát
// hívja — a létrehozó ORG_CONSULTANT-ként kerül a szervezetbe.

export function NewClientOrgForm({ isHu }: { isHu: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cégadatok (opcionális) — később az admin felületen is kitölthető/bővíthető.
  const [billingOpen, setBillingOpen] = useState(false);
  const [billing, setBilling] = useState<OrgBillingProfile>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), asConsultant: true, billing }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "NOT_CONSULTANT"
            ? isHu
              ? "Nincs tanácsadói kijelölésed — a platform admin tud hozzárendelni."
              : "You are not an assigned consultant — the platform admin can assign you."
            : isHu
              ? "Nem sikerült létrehozni a szervezetet."
              : "Could not create the organization.",
        );
        return;
      }
      const { org } = await res.json();
      router.push(`/org/${org.id}`);
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba." : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card spacing="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label={isHu ? "Szervezet neve" : "Organization name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isHu ? "pl. Kovács Kft." : "e.g. Acme Ltd."}
          maxLength={100}
          required
          disabled={loading}
        />
        {/* ── Cégadatok (opcionális) — csak a név kötelező ── */}
        <div className="rounded-xl border border-sand bg-cream/50 p-4">
          <button
            type="button"
            onClick={() => setBillingOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-caption font-semibold text-ink-body transition hover:text-bronze"
          >
            <span>{billingOpen ? "▾" : "▸"}</span>
            {isHu ? "Cégadatok — opcionális" : "Company details — optional"}
          </button>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {isHu
              ? "Ha kéznél vannak, már most megadhatod a számlázási adatokat — de később, az admin felületen is kitöltheted."
              : "If you have them handy, add the billing details now — you can also fill them in later on the admin surface."}
          </p>
          {billingOpen && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ORG_BILLING_FIELDS.map((field) => {
                const value = (billing[field.key] as string | undefined) ?? "";
                const onChange = (v: string) =>
                  setBilling((b) => ({ ...b, [field.key]: v }));
                return (
                  <label
                    key={field.key}
                    className={field.type === "textarea" ? "flex flex-col gap-1 sm:col-span-2" : "flex flex-col gap-1"}
                  >
                    <span className="text-[11px] font-medium text-muted">{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                        disabled={loading}
                        className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 py-2 text-base text-ink outline-none transition focus:border-sage md:text-xs"
                      />
                    ) : (
                      // Mobilon 16px-es input-font: az iOS Safari 16px alatt
                      // fókuszkor rázoomol és elugrik a layout. md-től marad
                      // az eredeti, kompakt 12px.
                      <input
                        type={field.type ?? "text"}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        disabled={loading}
                        className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 text-base text-ink outline-none transition focus:border-sage md:text-xs"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && <InlineBanner variant="error">{error}</InlineBanner>}
        <div>
          <Button type="submit" disabled={!name.trim()} loading={loading} variant="primary">
            {loading
              ? isHu ? "Létrehozás..." : "Creating..."
              : isHu ? "Szervezet létrehozása" : "Create organization"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
