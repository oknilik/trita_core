"use client";

import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import Link from "next/link";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";

// Org cockpit „Jelöltek" fül (2026-07-23, jelölt-flow újraélesztés) —
// kompakt áttekintés a tanácsadónak: állapot-számok + friss jelöltek,
// a teljes kezelőfelület (meghívás, resend/revoke) a /hiring/[orgId]-n.

export interface OrgCandidateRow {
  id: string;
  name: string | null;
  email: string | null;
  position: string | null;
  status: string;
  teamName: string | null;
  hasResult: boolean;
  createdAt: string;
}

export function OrgCandidatesTab({
  orgId,
  candidates,
  isHu,
  dateLocale,
}: {
  orgId: string;
  candidates: OrgCandidateRow[];
  isHu: boolean;
  dateLocale: string;
}) {
  const pending = candidates.filter((c) => c.status === "PENDING").length;
  const completed = candidates.filter((c) => c.status === "COMPLETED").length;
  // Összegző nézet (UX-audit #20): 3 friss sor — a teljes lista a /hiring-en.
  const recent = candidates.slice(0, 3);

  const statusMeta = (status: string): { label: string; className: string } => {
    if (status === "COMPLETED")
      return { label: isHu ? "Kész" : "Done", className: "bg-sage/10 text-sage-dark" };
    if (status === "CANCELED")
      return { label: isHu ? "Visszavonva" : "Revoked", className: "bg-cream text-muted" };
    return { label: isHu ? "Folyamatban" : "Pending", className: "bg-state-warning-bg text-state-warning-fg" };
  };

  return (
    <Card spacing="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionEyebrow tone="bronze">
            {isHu ? "jelöltek" : "candidates"}
          </SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-xl text-ink">
            {isHu ? "Jelölt-felmérések" : "Candidate assessments"}
          </h2>
          <p className="mt-1 text-xs text-ink-body">
            {isHu
              ? "Személyiség-felmérés (opcionális csapatszerep-kérdőívvel) a szervezeten kívüli jelölteknek — kitöltés után szabadon illeszthető bármely csapathoz."
              : "Personality assessment (with optional team-role questionnaire) for external candidates — freely matched to any team after completion."}
          </p>
        </div>
        <Link
          href={`/hiring/${orgId}`}
          className={getButtonClassName({ variant: "primary", size: "sm" })}
        >
          {isHu ? "Jelölt meghívása →" : "Invite candidate →"}
        </Link>
      </div>

      {/* Mobilon egymás alatti, vízszintes stat-sorok: a 3 oszlopos rács
          ~50px-es csempéin a HU címkék („FOLYAMATBAN") kilógtak és rácsúsztak
          a szomszédra. md-től változatlan a hármas, középre zárt rács. */}
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-sand bg-cream p-3 md:block md:text-center">
          <p className="font-fraunces text-heading leading-none tabular-nums text-ink">{candidates.length}</p>
          <p className="text-micro uppercase tracking-wide text-muted md:mt-1">{isHu ? "Összes" : "Total"}</p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-sand bg-cream p-3 md:block md:text-center">
          <p className="font-fraunces text-heading leading-none tabular-nums text-ink">{pending}</p>
          <p className="text-micro uppercase tracking-wide text-muted md:mt-1">{isHu ? "Folyamatban" : "Pending"}</p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-sand bg-cream p-3 md:block md:text-center">
          <p className="font-fraunces text-heading leading-none tabular-nums text-sage">{completed}</p>
          <p className="text-micro uppercase tracking-wide text-muted md:mt-1">{isHu ? "Kész" : "Done"}</p>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {isHu ? "Még nincs meghívott jelölt." : "No candidates invited yet."}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {recent.map((c) => {
            const meta = statusMeta(c.status);
            const display = c.name ?? c.email ?? "—";
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-sand bg-surface-card px-4 py-3"
              >
                <span className={`rounded-full px-2 py-0.5 text-note font-medium ${meta.className}`}>
                  {meta.label}
                </span>
                <span className="text-sm font-semibold text-ink">{display}</span>
                {c.position && <span className="text-xs text-muted">· {c.position}</span>}
                {c.teamName && <span className="text-xs text-muted">· {c.teamName}</span>}
                <span className="ml-auto text-xs text-muted">
                  {new Date(c.createdAt).toLocaleDateString(dateLocale)}
                </span>
                {c.hasResult && (
                  <Link
                    href={`/hiring/${orgId}/candidates/${c.id}`}
                    className="text-xs font-semibold text-[var(--color-accent-primary-strong)] hover:underline"
                  >
                    {isHu ? "Eredmény →" : "Result →"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* A kanonikus jelölt-munkafelület a /hiring — innen mindig egy link visz oda. */}
      <Link
        href={`/hiring/${orgId}`}
        className="mt-3 inline-flex text-xs font-semibold text-[var(--color-accent-primary-strong)] hover:underline"
      >
        {isHu
          ? `Jelölt-felület megnyitása (${candidates.length}) →`
          : `Open candidate workspace (${candidates.length}) →`}
      </Link>
    </Card>
  );
}
