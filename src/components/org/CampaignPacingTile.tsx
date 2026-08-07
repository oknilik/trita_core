"use client";

// Futó mérés-sorozat csempe (org cockpit) — az éppen nyitott kérdőív,
// vagy visszaszámláló a következő ütemezett küldésig. Admin/tanácsadó
// innen tudja átállítani az ütemet és azonnal kiküldeni a következőt.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAMPAIGN_STEP_LABELS,
  isCampaignStepType,
} from "@/lib/campaign-steps-core";

export interface CampaignPacingTileData {
  orgId: string;
  campaignId: string;
  campaignName: string;
  teamName: string | null;
  stepIntervalHours: number;
  totalParticipants: number;
  doneCount: number;
  /** Nyitott (kitölthető) lépésnél tartók száma + a leggyakoribb nyitott lépés. */
  openCount: number;
  openStepType: string | null;
  /** Ütemezésre várók száma + a legkorábbi nyitási időpont (ISO). */
  scheduledCount: number;
  nextReleaseAt: string | null;
}

function useCountdown(targetIso: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [targetIso]);
  return useMemo(() => {
    if (!targetIso) return null;
    const ms = new Date(targetIso).getTime() - now;
    if (ms <= 0) return "0:00";
    const totalMin = Math.round(ms / 60_000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
  }, [targetIso, now]);
}

export function CampaignPacingTile({
  data,
  canManagePacing,
  isHu,
}: {
  data: CampaignPacingTileData;
  canManagePacing: boolean;
  isHu: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const countdown = useCountdown(data.nextReleaseAt);

  const pacingUrl = `/api/org/${data.orgId}/campaigns/${data.campaignId}/pacing`;
  const stepLabel =
    data.openStepType && isCampaignStepType(data.openStepType)
      ? CAMPAIGN_STEP_LABELS[data.openStepType][isHu ? "hu" : "en"]
      : null;

  const call = async (body: object, key: string, confirmation: string) => {
    if (busy) return;
    setBusy(key);
    setError(false);
    setSaved(null);
    try {
      const res = await fetch(pacingUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      // Visszajelzés a beavatkozásról (UX-audit #19) — a kattintás élesben
      // átütemezi a függő lépéseket, ezt ki is mondjuk.
      setSaved(confirmation);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-[18px] border border-sage/35 bg-sage/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-micro uppercase tracking-widest text-sage-dark">
            {isHu ? "Futó mérés-sorozat" : "Running measurement series"}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">
            {data.campaignName}
            {data.teamName ? <span className="font-normal text-muted"> · {data.teamName}</span> : null}
          </p>

          {data.openCount > 0 && stepLabel ? (
            // Szám-definíció kimondva (UX-audit #14): a „teljes" itt a TELJES
            // SOROZAT végigvitele — a kampánykártya lépés-számaival nem
            // keverendő, ezért a címke megnevezi, mire vonatkozik.
            <p className="mt-1.5 text-caption leading-relaxed text-ink-body">
              {isHu ? (
                <>Éppen kitölthető: <span className="font-semibold text-ink">{stepLabel}</span> — {data.openCount} tagnál nyitva. A teljes sorozattal {data.doneCount}/{data.totalParticipants} tag végzett.</>
              ) : (
                <>Currently open: <span className="font-semibold text-ink">{stepLabel}</span> — open for {data.openCount} member(s). {data.doneCount}/{data.totalParticipants} members have finished the full series.</>
              )}
            </p>
          ) : data.scheduledCount > 0 ? (
            <p className="mt-1.5 text-caption leading-relaxed text-ink-body">
              {isHu
                ? `Most nincs nyitott kérdőív — a következő ${data.scheduledCount} tagnak ütemezve.`
                : `No questionnaire open right now — the next is scheduled for ${data.scheduledCount} member(s).`}
            </p>
          ) : (
            <p className="mt-1.5 text-caption leading-relaxed text-ink-body">
              {isHu
                ? `Minden résztvevő végzett (${data.doneCount}/${data.totalParticipants}).`
                : `All participants are done (${data.doneCount}/${data.totalParticipants}).`}
            </p>
          )}

          {data.scheduledCount > 0 && countdown ? (
            <p className="mt-1 text-caption text-muted">
              {isHu ? "Következő küldés: " : "Next send in: "}
              <span className="font-mono font-semibold tabular-nums text-sage-dark">{countdown}</span>
              {isHu ? " óra múlva" : " hours"}
            </p>
          ) : null}
        </div>

        {canManagePacing ? (
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {data.scheduledCount > 0 ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  call(
                    { action: "release_now" },
                    "release",
                    isHu ? "Kiküldve — a nyitott lépés mindenkinél elérhető." : "Sent — the open step is now available to everyone.",
                  )
                }
                className="inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-4 text-caption font-semibold text-white transition hover:brightness-110 disabled:opacity-50 md:min-h-[38px]"
              >
                {busy === "release" ? "…" : isHu ? "Küldés most" : "Send now"}
              </button>
            ) : null}
            {/* Élő beavatkozás mobilról is: tördelhető kapcsolósor,
                44px-es érintési célokkal. */}
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end md:gap-1.5">
              <span className="text-micro uppercase tracking-wide text-muted">
                {isHu ? "Ütem" : "Pace"}
              </span>
              {[0, 12, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    call(
                      { action: "interval", stepIntervalHours: h },
                      `int${h}`,
                      isHu
                        ? `Ütem átállítva (${h === 0 ? "azonnal" : `${h}h`}) — a függő lépések újraütemezve.`
                        : `Pace updated (${h === 0 ? "immediate" : `${h}h`}) — pending steps rescheduled.`,
                    )
                  }
                  className={[
                    // Mobilon 44px-es érintési cél, md-től az eredeti kompakt méret.
                    "min-h-[44px] min-w-[44px] rounded-lg border px-3 text-label font-semibold tracking-normal transition disabled:opacity-50 md:min-h-[30px] md:min-w-0 md:px-2",
                    data.stepIntervalHours === h
                      ? "border-ink bg-ink text-white"
                      : "border-sand bg-surface-card text-ink-body hover:border-ink/40",
                  ].join(" ")}
                >
                  {h === 0 ? (isHu ? "azonnal" : "now") : `${h}h`}
                </button>
              ))}
            </div>
            {/* Kontextus a kapcsolósorhoz (UX-audit #19): mit állít az ütem. */}
            <p className="max-w-[260px] text-left text-label font-normal leading-snug tracking-normal text-muted sm:text-right">
              {isHu
                ? "A teljesített kérdőív után ennyivel nyílik (és értesít) a következő lépés."
                : "The next step opens (and notifies) this long after the previous one is completed."}
            </p>
            {saved ? (
              <p className="text-label font-semibold tracking-normal text-sage-dark">{saved}</p>
            ) : null}
            {error ? (
              <p className="text-label font-semibold tracking-normal text-state-warning-fg">
                {isHu ? "Nem sikerült — próbáld újra." : "Failed — please retry."}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
