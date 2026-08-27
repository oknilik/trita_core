import Link from "next/link";
import { tf, type Locale } from "@/lib/i18n";
import type {
  SerializedMemberDossier,
  DossierMeasurementKey,
  DossierEdgeType,
} from "@/lib/member-dossier";
import { HEXACO_DIMENSIONS, HEXACO_FACETS } from "@/lib/hexaco";
import { TEAM_ROLES, type TeamRoleCode } from "@/lib/team-role-scoring";
import { TEAM_ROLE_PEER_MIN_RATERS } from "@/lib/team-role-peer";
import { TRUST_MIN_RATERS } from "@/lib/trust-network";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import {
  CAMPAIGN_STEP_LABELS,
  isCampaignStepType,
} from "@/lib/campaign-steps-core";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

const CARD = "rounded-[22px] border border-sand bg-surface-card p-5 shadow-sm md:p-6";

const MEASUREMENT_LABELS: Record<DossierMeasurementKey, { hu: string; en: string }> = {
  self: { hu: "Önfelmérés", en: "Self-assessment" },
  observer: { hu: "Külső (observer) kép", en: "Observer feedback" },
  teamRoleSelf: { hu: "Csapatszerep – önkép", en: "Team role – self" },
  teamRolePeer: { hu: "Csapatszerep – peer", en: "Team role – peer" },
  trustGiven: { hu: "Adott bizalmi értékelés", en: "Trust given" },
  peerFeedback: { hu: "Kapott visszajelzés", en: "Feedback received" },
};

const FEEDBACK_KIND_LABELS: Record<string, { hu: string; en: string }> = {
  appreciation: { hu: "Elismerés", en: "Appreciation" },
  feedforward: { hu: "Feedforward", en: "Feedforward" },
};

const EDGE_STYLES: Record<DossierEdgeType, string> = {
  aligned: "border-state-success-border bg-state-success-bg text-state-success-fg",
  complementary: "border-sand bg-cream text-ink-body",
  friction: "border-state-warning-border bg-state-warning-bg text-state-warning-fg",
};

const EDGE_LABELS: Record<DossierEdgeType, { hu: string; en: string }> = {
  aligned: { hu: "hasonló", en: "aligned" },
  complementary: { hu: "kiegészítő", en: "complementary" },
  friction: { hu: "súrlódás", en: "friction" },
};

// Szerep-címke a nyers enum helyett (UX-audit #21b) — az OrgMembersTab
// roleLabel-fordítójával azonos szótár, isHu-alapon.
const ORG_ROLE_LABELS: Record<string, { hu: string; en: string }> = {
  ORG_ADMIN: { hu: "Admin", en: "Admin" },
  ORG_CONSULTANT: { hu: "Tanácsadó", en: "Consultant" },
  ORG_MANAGER: { hu: "Menedzser", en: "Manager" },
  ORG_MEMBER: { hu: "Tag", en: "Member" },
};

function orgRoleLabel(role: string, isHu: boolean): string {
  const l = ORG_ROLE_LABELS[role];
  return l ? (isHu ? l.hu : l.en) : role;
}

function fmtDate(iso: string | null, isHu: boolean): string {
  if (!iso) return isHu ? "még nincs" : "none yet";
  return new Date(iso).toLocaleDateString(isHu ? "hu-HU" : "en-US");
}

function roleName(code: TeamRoleCode, isHu: boolean): string {
  const r = TEAM_ROLES[code];
  return isHu ? r.hu : r.en;
}

export function MemberDossierView({
  dossier,
  orgId,
  isHu,
  hideIdentityHeader = false,
}: {
  dossier: SerializedMemberDossier;
  orgId: string;
  isHu: boolean;
  hideIdentityHeader?: boolean;
}) {
  const { header, participation, selfVsExternal: sx, embeddedness, feedback } = dossier;
  const locale: Locale = isHu ? "hu" : "en";

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ 1. FEJLÉC + RÉSZVÉTEL ═══ */}
      <section className={CARD}>
        <div
          className={`flex flex-wrap items-start gap-3 ${
            hideIdentityHeader ? "justify-end" : "justify-between"
          }`}
        >
          {!hideIdentityHeader ? (
            <div>
              <h1 className="font-fraunces text-2xl text-ink">{header.displayName}</h1>
              {header.email ? (
                <p className="mt-0.5 text-caption text-muted">{header.email}</p>
              ) : null}
            </div>
          ) : null}
          <span className="rounded-full border border-sand bg-cream px-3 py-1 text-micro font-semibold uppercase tracking-wide text-ink-body">
            {orgRoleLabel(header.orgRole, isHu)}
          </span>
        </div>

        {header.teams.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {header.teams.map((t) => (
              <Link
                key={t.id}
                href={`/team/${t.id}`}
                className="rounded-full border border-sand bg-surface-card px-2.5 py-0.5 text-xs text-ink-body transition-colors hover:border-sage-ring hover:text-ink"
              >
                {t.name}
              </Link>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-micro text-muted">
          {isHu ? `Csatlakozott: ${fmtDate(header.joinedAt, isHu)}` : `Joined: ${fmtDate(header.joinedAt, isHu)}`}
        </p>

        <SectionEyebrow variant="clean" tone="org" className="mt-5">
          {isHu ? "részvétel" : "participation"}
        </SectionEyebrow>
        <div className="mt-2 divide-y divide-sand/70">
          {participation.statuses.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 py-2">
              <span className="text-caption text-ink-body">
                {isHu ? MEASUREMENT_LABELS[s.key].hu : MEASUREMENT_LABELS[s.key].en}
              </span>
              <span className="flex items-center gap-3 text-micro text-muted">
                <span className="tabular-nums">
                  {s.count} {isHu ? "db" : "×"}
                </span>
                <span className="tabular-nums">
                  {s.count > 0 ? fmtDate(s.lastAt, isHu) : isHu ? "még nincs" : "none yet"}
                </span>
              </span>
            </div>
          ))}
        </div>

        {participation.activeCampaigns.length > 0 ? (
          <div className="mt-4">
            <SectionEyebrow variant="clean" tone="org">
              {isHu ? "aktív mérés-sorozatok" : "active campaigns"}
            </SectionEyebrow>
            <div className="mt-2 flex flex-col gap-1.5">
              {participation.activeCampaigns.map((c) => {
                const stepLabel =
                  c.currentStepType && isCampaignStepType(c.currentStepType)
                    ? isHu
                      ? CAMPAIGN_STEP_LABELS[c.currentStepType].hu
                      : CAMPAIGN_STEP_LABELS[c.currentStepType].en
                    : c.currentStepType ?? (isHu ? "minden lépés kész" : "all steps done");
                return (
                  <div key={c.campaignId} className="flex items-center justify-between gap-3">
                    <Link
                      href={`/org/${orgId}/campaigns/${c.campaignId}`}
                      className="text-caption font-medium text-ink transition-colors hover:text-sage"
                    >
                      {c.name}
                    </Link>
                    <span className="text-micro text-muted">
                      {stepLabel} · {c.stepIndex + 1}/{c.stepCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* ═══ 2. ÖNKÉP vs. KÜLSŐ KÉP ═══ */}
      <section className={CARD}>
        <SectionEyebrow variant="clean" tone="org">
          {isHu ? "önkép vs. külső kép" : "self vs. external"}
        </SectionEyebrow>

        {!sx.hasSelf ? (
          <p className="mt-3 text-caption text-muted">
            {isHu
              ? "A tag még nem töltötte ki a személyiségfelmérést."
              : "This member has not completed the assessment yet."}
          </p>
        ) : (
          <>
            <table className="mt-3 w-full text-caption">
              <thead>
                <tr className="text-micro uppercase tracking-wide text-muted">
                  <th className="py-1.5 text-left font-medium">{isHu ? "Dimenzió" : "Dimension"}</th>
                  <th className="py-1.5 text-right font-medium">{isHu ? "Ön" : "Self"}</th>
                  <th className="py-1.5 text-right font-medium">{isHu ? "Külső" : "External"}</th>
                  <th className="py-1.5 text-right font-medium">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {sx.dims.map((d) => {
                  // Önkép–külső kép eltérés kiemelése CSAK a kanonikus
                  // difference-kapu (DIFF_MIN_GAP = round(√2·SEM)) felett – a
                  // 10–14 pontos Δ két pontszám különbségeként még a mérési
                  // zajon belül van. Ugyanaz a küszöb, mint a ComparisonTab /
                  // PDF összevetéseknél; a korábbi 10-es érték túl-jelzett.
                  const big = d.delta !== null && Math.abs(d.delta) >= DIFF_MIN_GAP;
                  const facets = sx.facets.filter((f) => f.dimensionCode === d.code);
                  return [
                    <tr
                      key={d.code}
                      className={big ? "bg-state-warning-bg/60" : "bg-cream/40"}
                    >
                      <td className="py-2 font-semibold text-ink-body">
                        {isHu ? HEXACO_DIMENSIONS[d.code].hu : HEXACO_DIMENSIONS[d.code].en}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums text-ink">{d.self}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-ink">
                        {d.observer ?? "–"}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums font-semibold ${
                          big ? "text-state-warning-fg" : "text-ink-body"
                        }`}
                      >
                        {d.delta === null ? "–" : d.delta > 0 ? `+${d.delta}` : d.delta}
                      </td>
                    </tr>,
                    ...facets.map((f) => (
                      <tr key={`${d.code}-${f.code}`}>
                        <td className="py-1.5 pl-4 text-ink-body">
                          <span className="mr-2 text-muted" aria-hidden="true">↳</span>
                          {isHu ? HEXACO_FACETS[f.code]?.hu : HEXACO_FACETS[f.code]?.en}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-ink">{f.self}</td>
                        <td className="py-1.5 text-right tabular-nums text-ink">
                          {f.observer ?? "–"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums font-medium text-ink-body">
                          {f.delta === null ? "–" : f.delta > 0 ? `+${f.delta}` : f.delta}
                        </td>
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>

            {sx.facets.length === 0 ? (
              <p className="mt-2 text-micro text-muted">
                {isHu
                  ? "Ehhez a kitöltéshez nem érhető el facet-szintű bontás."
                  : "Facet-level breakdown is not available for this assessment."}
              </p>
            ) : null}

            <p className="mt-2 text-micro text-muted">
              {sx.observerShown
                ? isHu
                  ? `${sx.observerCount} értékelő aggregált átlaga – egyéni válasz nem jelenik meg.`
                  : `Aggregated average of ${sx.observerCount} raters – no individual response is shown.`
                : isHu
                  ? `Külső oszlophoz legalább ${MIN_RATERS_FOR_ANONYMOUS_AGGREGATE} lezárt observer-értékelés kell (jelenleg: ${sx.observerCount}).`
                  : `The external column needs at least ${MIN_RATERS_FOR_ANONYMOUS_AGGREGATE} completed observer ratings (currently: ${sx.observerCount}).`}
            </p>

            {/* Rater-minőség jelzés – aggregált darabszám, raterenkénti flag soha. */}
            {sx.observerSuspectCount >= 1 ? (
              <p className="mt-1 text-micro text-muted">
                {tf("memberDossier.observerQualityNote", locale, {
                  n: sx.observerSuspectCount,
                })}
              </p>
            ) : null}

            {sx.topGaps.length > 0 ? (
              <div className="mt-4 rounded-xl border border-state-warning-border bg-state-warning-bg p-3.5">
                <p className="text-micro font-semibold uppercase tracking-wide text-state-warning-fg">
                  {isHu ? "Debrief-belépőpontok" : "Debrief entry points"}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {sx.topGaps.map((g) => (
                    <li key={g.code} className="text-caption text-ink-body">
                      {isHu ? HEXACO_DIMENSIONS[g.code].hu : HEXACO_DIMENSIONS[g.code].en}:{" "}
                      <span className="tabular-nums font-medium">
                        {g.delta! > 0 ? `+${g.delta}` : g.delta}
                      </span>{" "}
                      {isHu
                        ? g.delta! > 0
                          ? "(a külső kép magasabb)"
                          : "(az önkép magasabb)"
                        : g.delta! > 0
                          ? "(external higher)"
                          : "(self higher)"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Csapatszerep self vs peer */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted">
                  {isHu ? "Csapatszerep – önkép (top 3)" : "Team role – self (top 3)"}
                </p>
                {sx.teamRole.selfTop && sx.teamRole.selfTop.length > 0 ? (
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {sx.teamRole.selfTop.slice(0, 3).map((r) => (
                      <li key={r.role} className="flex justify-between text-caption text-ink-body">
                        <span>{roleName(r.role, isHu)}</span>
                        <span className="tabular-nums text-muted">{r.score}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-caption text-muted">
                    {isHu ? "nincs kitöltés" : "not completed"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted">
                  {isHu ? "Csapatszerep – peer (top 3)" : "Team role – peer (top 3)"}
                </p>
                {sx.teamRole.peerTop.length > 0 ? (
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {sx.teamRole.peerTop.slice(0, 3).map((r) => (
                      <li key={r.role} className="flex justify-between text-caption text-ink-body">
                        <span>{roleName(r.role, isHu)}</span>
                        <span className="tabular-nums text-muted">{r.score}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-caption text-muted">
                    {isHu
                      ? `Peer-képhez legalább ${TEAM_ROLE_PEER_MIN_RATERS} értékelő kell (jelenleg: ${sx.teamRole.peerRaterCount}).`
                      : `Peer picture needs at least ${TEAM_ROLE_PEER_MIN_RATERS} raters (currently: ${sx.teamRole.peerRaterCount}).`}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ═══ 3. KAPCSOLATI BEÁGYAZOTTSÁG ═══ */}
      <section className={CARD}>
        <SectionEyebrow variant="clean" tone="org">
          {isHu ? "kapcsolati beágyazottság" : "relational embeddedness"}
        </SectionEyebrow>

        {embeddedness.length === 0 ? (
          <p className="mt-3 text-caption text-muted">
            {isHu ? "A tag nem tartozik csapathoz." : "This member is not in any team."}
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {embeddedness.map((t) => (
              <div key={t.teamId} className="rounded-xl border border-sand bg-cream/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/team/${t.teamId}`}
                      className="text-caption font-semibold text-ink transition-colors hover:text-sage"
                    >
                      {t.teamName}
                    </Link>
                    {t.isHub ? (
                      <span className="rounded-full bg-state-success-bg px-2 py-0.5 text-micro font-medium text-state-success-fg">
                        {isHu ? "összekötő" : "hub"}
                      </span>
                    ) : null}
                    {t.isIsolated ? (
                      <span className="rounded-full bg-state-warning-bg px-2 py-0.5 text-micro font-medium text-state-warning-fg">
                        {isHu ? "beágyazatlan" : "isolated"}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-micro text-muted">
                    {t.inboundMean !== null
                      ? isHu
                        ? `befelé irányuló bizalom: ${t.inboundMean}/100 (${t.inboundCount} értékelő, mért)`
                        : `inbound trust: ${t.inboundMean}/100 (${t.inboundCount} raters, measured)`
                      : isHu
                        ? `bizalmi képhez legalább ${TRUST_MIN_RATERS} értékelő kell (jelenleg: ${t.inboundCount})`
                        : `trust picture needs at least ${TRUST_MIN_RATERS} raters (currently: ${t.inboundCount})`}
                  </span>
                </div>

                {t.edges.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.edges.map((e) => (
                      <span
                        key={`${t.teamId}-${e.otherUserId}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro ${EDGE_STYLES[e.type]}`}
                      >
                        <span className="font-medium">{e.otherName}</span>
                        <span className="opacity-70">
                          {isHu ? EDGE_LABELS[e.type].hu : EDGE_LABELS[e.type].en} ·{" "}
                          {e.measured ? (isHu ? "mért" : "measured") : isHu ? "becs." : "est."}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-micro text-muted">
                    {isHu ? "nincs megjeleníthető kapcsolat" : "no relationships to show"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-micro text-muted">
          {isHu
            ? "A kapcsolatok pár-szintű aggregátumok – egyéni (irányított) bizalmi válasz soha nem jelenik meg."
            : "Relationships are pair-level aggregates – no individual (directed) trust response is ever shown."}
        </p>
      </section>

      {/* ═══ 4. KAPOTT VISSZAJELZÉSEK ═══ */}
      <section className={CARD}>
        <div className="flex items-start justify-between gap-3">
          <SectionEyebrow variant="clean" tone="org">
            {isHu ? "kapott visszajelzések" : "feedback received"}
          </SectionEyebrow>
          {feedback.anonymousCount > 0 ? (
            <span className="text-micro text-muted">
              {isHu
                ? `+ ${feedback.anonymousCount} anonim tétel (tartalma nem jeleníthető meg)`
                : `+ ${feedback.anonymousCount} anonymous item(s) (content not shown)`}
            </span>
          ) : null}
        </div>

        {feedback.namedItems.length === 0 ? (
          <p className="mt-3 text-caption text-muted">
            {isHu ? "Még nincs nevesített visszajelzés." : "No named feedback yet."}
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {feedback.namedItems.map((f, i) => (
              <div key={i} className="rounded-xl border border-sand bg-cream/40 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-sage-ghost px-2 py-0.5 text-micro font-medium text-sage-deep">
                    {FEEDBACK_KIND_LABELS[f.kind]
                      ? isHu
                        ? FEEDBACK_KIND_LABELS[f.kind].hu
                        : FEEDBACK_KIND_LABELS[f.kind].en
                      : f.kind}
                  </span>
                  <span className="text-micro text-muted">
                    {f.fromName} · {f.teamName} · {fmtDate(f.createdAt, isHu)}
                  </span>
                </div>
                {f.message ? (
                  <p className="mt-2 text-caption leading-relaxed text-ink-body">{f.message}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-micro text-muted">
        {isHu
          ? `Dossié generálva: ${fmtDate(dossier.generatedAt, isHu)} · csak tanácsadó látja.`
          : `Dossier generated: ${fmtDate(dossier.generatedAt, isHu)} · visible to consultants only.`}
      </p>
    </div>
  );
}
