"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives/Button";

export interface AdminLegalStats {
  versions: {
    platformTerms: string;
    privacyNotice: string;
    effectiveDate: string;
  };
  eligible: number;
  accepted: number;
  pending: number;
  currentCampaignActive: boolean;
  activeCampaign: {
    platformTermsVersion: string;
    privacyNoticeVersion: string;
    activatedAt: string;
    lastSentAt: string | null;
    recipientCount: number;
    sendCount: number;
  } | null;
}

export function AdminLegalSection({ stats }: { stats: AdminLegalStats }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/legal-acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        recipients?: number;
        emailAccepted?: number;
        emailFailed?: number;
      };
      if (!response.ok || !data.ok) throw new Error("SEND_FAILED");

      if (dryRun) {
        setPreviewCount(data.recipients ?? 0);
        setConfirming(true);
        setMessage(`Próbafutás: ${data.recipients ?? 0} felhasználónak szükséges új elfogadás.`);
      } else {
        setMessage(
          `Az elfogadási kérés ${data.recipients ?? 0} felhasználónál aktiválódott. `
          + `${data.emailAccepted ?? 0} emailt átvett a szolgáltató`
          + `${data.emailFailed ? `, ${data.emailFailed} küldés hibás volt` : ""}.`,
        );
        setConfirming(false);
        setPreviewCount(null);
        router.refresh();
      }
    } catch {
      setMessage("A művelet nem sikerült – nézd meg a szerver-naplót.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
      <p className="font-dm-mono text-micro font-semibold uppercase tracking-widest text-muted">
        Jogi elfogadások
      </p>
      <h2 className="mt-2 font-fraunces text-xl text-ink">Aktuális dokumentumverziók</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-body">
        Új dokumentumverzió telepítése után innen aktiválható a kötelező újbóli elfogadás.
        A kiküldés alkalmazáson belüli értesítést és tranzakcionális emailt készít, a következő
        belépéskor pedig az elfogadásig lezárja az alkalmazás felületét.
      </p>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Platform ÁSZF" value={stats.versions.platformTerms} />
        <Stat label="Adatkezelés" value={stats.versions.privacyNotice} />
        <Stat label="Elfogadta" value={`${stats.accepted}/${stats.eligible}`} />
        <Stat label="Elfogadásra vár" value={String(stats.pending)} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-3 text-caption text-ink-body">
        <Link className="font-semibold text-sage underline-offset-4 hover:underline" href="/legal/platform-terms" target="_blank">
          Platform ÁSZF megnyitása
        </Link>
        <Link className="font-semibold text-sage underline-offset-4 hover:underline" href="/privacy" target="_blank">
          Adatkezelési tájékoztató megnyitása
        </Link>
      </div>

      {stats.activeCampaign ? (
        <div className="mt-5 rounded-xl border border-sand bg-cream p-4 text-caption text-ink-body">
          <p className="font-semibold text-ink">
            {stats.currentCampaignActive ? "Az aktuális verzió aktív." : "Korábbi verzió aktív."}
          </p>
          <p className="mt-1">
            Utolsó kiküldés: {stats.activeCampaign.lastSentAt
              ? new Date(stats.activeCampaign.lastSentAt).toLocaleString("hu-HU")
              : "még nem volt"}
            {` · ${stats.activeCampaign.sendCount} kiküldés`}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void run(true)}>
          Próbafutás
        </Button>
        <Button
          disabled={busy || previewCount === null}
          onClick={() => setConfirming(true)}
        >
          Kiküldés ellenőrzése
        </Button>
      </div>

      {confirming && previewCount !== null ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-state-warning-border bg-state-warning-bg p-3">
          <p className="text-caption text-ink-body">
            {previewCount} felhasználónál azonnal kötelezővé válik az új elfogadás.
          </p>
          <Button size="sm" loading={busy} disabled={busy} onClick={() => void run(false)}>
            Igen, aktiválom és kiküldöm
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
            Mégsem
          </Button>
        </div>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite" className="mt-3 text-caption text-ink-body">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand bg-cream p-4">
      <dt className="text-micro uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-ink">{value}</dd>
    </div>
  );
}
