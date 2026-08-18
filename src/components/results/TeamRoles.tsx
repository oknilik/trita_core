"use client";

import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import type { TeamRoleCode } from "@/lib/team-role-scoring";
import { compareSelfAndPeerTopRoles, TEAM_ROLE_PEER_MIN_RATERS } from "@/lib/team-role-peer";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export interface TeamRolesPeerData {
  raterCount: number;
  /** null a küszöb (n ≥ 3) alatt. */
  scores: Record<string, number> | null;
  topRoles: { role: string; score: number }[];
}

interface TeamRolesProps {
  tritanScores: Record<string, number>;
  locale: Locale;
  /** Kitöltött csapatszerep-kérdőív eredménye — ha van, ez a mérvadó. */
  measuredScores?: Record<string, number> | null;
  /** Csapattársi visszajelzés aggregátuma (kampányból). */
  peer?: TeamRolesPeerData | null;
}

const ROLE_SUBTITLES: Record<TeamRoleCode, { hu: string; en: string }> = {
  OG: { hu: "Kreatív ötletgazda a csapatban", en: "Creative ideas person in the team" },
  KE: { hu: "Lelkes networker a csapatban", en: "Enthusiastic networker in the team" },
  KO: { hu: "Érett koordinátor a csapatban", en: "Mature coordinator in the team" },
  HA: { hu: "Dinamikus hajtóerő a csapatban", en: "Dynamic driver in the team" },
  ER: { hu: "Stratégiai elemző a csapatban", en: "Strategic analyst in the team" },
  CS: { hu: "Együttműködő támasz a csapatban", en: "Cooperative support in the team" },
  MV: { hu: "Megbízható végrehajtó a csapatban", en: "Reliable implementer in the team" },
  MI: { hu: "Aprólékos tökéletesítő a csapatban", en: "Painstaking finisher in the team" },
  SZ: { hu: "Szaktudású specialista a csapatban", en: "Expert specialist in the team" },
};

const ROLE_DESCRIPTIONS: Record<TeamRoleCode, { hu: string; en: string }> = {
  OG: { hu: "Eredeti gondolkodó, aki új megoldásokat hoz — de néha elszakad a gyakorlati megvalósítástól.", en: "Original thinker who brings new solutions — but can lose touch with practical implementation." },
  KE: { hu: "Könnyen teremt kapcsolatokat és hoz külső lehetőségeket — de az utánkövetés nem az erőssége.", en: "Easily builds connections and brings external opportunities — but follow-through isn't their strength." },
  KO: { hu: "Természetes facilitátor, aki célra fókuszálja a csapatot — de delegálhat túl sokat.", en: "Natural facilitator who focuses the team on goals — but may over-delegate." },
  HA: { hu: "Hajtott, kihívásokat kereső típus. Nyomás alatt is teljesít, előre viszi a csapatot — de néha türelmetlenül.", en: "Driven, challenge-seeking type. Performs under pressure, pushes the team forward — but sometimes impatiently." },
  ER: { hu: "Tárgyilagosan elemez, jó döntéseket hoz — de lassú reagálású és túl kritikus lehet.", en: "Analyzes objectively, makes good decisions — but can be slow to react and overly critical." },
  CS: { hu: "Segítőkész és diplomata, enyhíti a feszültséget — de döntéshelyzetben határozatlan lehet.", en: "Helpful and diplomatic, eases tension — but can be indecisive in decision moments." },
  MV: { hu: "Rendszeres és megbízható, terveket valósít meg — de rugalmatlan lehet új helyzetekben.", en: "Systematic and reliable, turns plans into action — but can be inflexible in new situations." },
  MI: { hu: "Precíz és alapos, hibákat kiszűr a végén — de aggódhat a határidők miatt.", en: "Precise and thorough, catches errors at the end — but may worry about deadlines." },
  SZ: { hu: "Mélyreható szaktudás, nélkülözhetetlen egy területen — de szűk fókuszú lehet.", en: "Deep expertise, indispensable in one area — but can have a narrow focus." },
};

const RANK_LABELS = [
  { hu: "Elsődleges", en: "Primary" },
  { hu: "Másodlagos", en: "Secondary" },
  { hu: "Harmadik", en: "Third" },
];

export function TeamRoles({
  tritanScores,
  locale,
  measuredScores = null,
  peer = null,
}: TeamRolesProps) {
  const lang = locale === "hu" ? "hu" : "en";

  const hasTritanDims = "H" in tritanScores && "X" in tritanScores;
  if (!hasTritanDims) return null;

  // Precedencia a kanonikus szabályból (team-role-estimate):
  // kitöltött kérdőív > TRITAN-becslés; részleges score-ból nincs becslés.
  const resolved = resolveDisplayRoleScores(measuredScores, tritanScores);
  if (!resolved) return null;
  // A becslés-oldali rangsorhoz a resolver exact evidenciája kell (S2):
  // kerekítetlen összegek nélkül a holtverseny hash-re esne, és az elsődleges
  // szerep felületenként eltérhetne. Mért ágon a becslés-top3 csak az
  // összhang-jelzéshez kell — ahhoz külön becslés-feloldás adja az exactot.
  const estimatedResolved = resolveDisplayRoleScores(null, tritanScores);
  const estimatedTop3 = estimatedResolved
    ? getTopRoles(estimatedResolved.scores, 3, estimatedResolved.exact)
    : [];
  const isMeasured = resolved.source === "questionnaire";
  const top3 = isMeasured ? getTopRoles(resolved.scores, 3) : estimatedTop3;

  // Összhang a személyiségprofillal: a MÉRT top 3 vs a TRITAN-becslés top 3.
  // Csak TELJES dimenzió-készletből számolt becslés ellen — részleges
  // profilból nincs becslés (nincs mihez hasonlítani).
  const personalityOverlap =
    isMeasured && estimatedTop3.length > 0
      ? compareSelfAndPeerTopRoles(top3, estimatedTop3).shared.length
      : null;

  // Önkép vs. csapatkép: a MÉRT top 3 vs a peer-aggregátum top 3. CSAK
  // kitöltött kérdőív ellen számolható — a becslés nem a user önképe,
  // hanem TRITAN-ból származtatott tipp; azt önképként bemutatni („Te
  // látod magadban…") hamis állítás lenne. A personalityOverlap-pel
  // azonos kapu (isMeasured); becslés-ágon a peer-kép önösszevetés
  // nélkül jelenik meg.
  const peerReady = Boolean(peer && peer.scores && peer.topRoles.length > 0);
  const peerDelta =
    peerReady && isMeasured
      ? compareSelfAndPeerTopRoles(
          top3,
          (peer as TeamRolesPeerData).topRoles.map((r) => ({ role: r.role as TeamRoleCode })),
        )
      : null;
  const roleNames = (codes: TeamRoleCode[]) =>
    codes.map((c) => TEAM_ROLES[c][lang]).join(", ");

  return (
    <section>
      <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
        {t("results.teamRoleEyebrow", locale)}
      </p>
      <div className="mt-1.5 mb-2 flex flex-wrap items-center gap-2.5">
        <h2 className="font-fraunces text-heading tracking-tight text-[var(--color-text-primary)]">
          {t("results.teamRoleTitle", locale)}
        </h2>
        {/* Forrás-badge: mért kitöltés vs. személyiség-alapú becslés. */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-micro font-bold uppercase tracking-wide ${
            isMeasured
              ? "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-action-primary-bg)]"
              : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"
          }`}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {isMeasured
            ? t("results.teamRoleSourceMeasured", locale)
            : t("results.teamRoleSourceEstimate", locale)}
        </span>
      </div>
      <p className="mb-4 max-w-lg text-caption leading-relaxed text-[var(--color-text-secondary)]">
        {t("content.teamRoleSub", locale)}
      </p>

      {/* Összhang-jelzés: mért szerep-kép vs. személyiségprofil. */}
      {personalityOverlap !== null ? (
        <div
          className={`mb-6 flex items-start gap-2.5 rounded-xl border-[1.5px] px-4 py-3 ${
            personalityOverlap >= 2
              ? "border-[var(--color-action-primary-bg)]/25 bg-[var(--color-surface-self-accent-soft)]"
              : "border-[var(--color-bronze-edge)] bg-[var(--color-bronze-100)]"
          }`}
        >
          <span className="mt-0.5 text-sm">{personalityOverlap >= 2 ? "✓" : "↔"}</span>
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {personalityOverlap >= 2
              ? t("results.teamRolePersonalityHarmony", locale)
              : tf("results.teamRolePersonalityDiverge", locale, {
                  roles: roleNames(estimatedTop3.map((r) => r.role)),
                })}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr]">
        {top3.map(({ role, score }, idx) => {
          const roleMeta = TEAM_ROLES[role];
          const subtitle = ROLE_SUBTITLES[role];
          const desc = ROLE_DESCRIPTIONS[role];
          const rank = RANK_LABELS[idx];
          const isPrimary = idx === 0;

          return (
            <div
              key={role}
              className={`flex cursor-pointer flex-col rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isPrimary
                  ? "border-2 border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] p-[22px]"
                  : "border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-[18px]"
              }`}
            >
              {/* Badge */}
              <span
                className={`mb-2 self-start rounded px-[9px] py-[3px] text-micro font-bold uppercase tracking-wide ${
                  isPrimary
                    ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]"
                    : idx === 1
                      ? "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]"
                      : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]"
                }`}
              >
                {/* Becslés-ágon NINCS szám: a súlyozott összeg nem százalék,
                    kiírva álprecizitás lenne (a PDF is elnyomja) — ott csak
                    a rang/sáv jelenik meg. */}
                {isMeasured ? `${rank[lang]} · ${score}%` : rank[lang]}
              </span>

              {/* Name */}
              <p
                className={`mb-0.5 font-fraunces text-[var(--color-text-primary)] ${
                  isPrimary ? "text-heading" : "text-heading"
                }`}
              >
                {roleMeta[lang]}
              </p>

              {/* Subtitle */}
              <p className="mb-1.5 text-note italic text-[var(--color-text-muted)]">
                {subtitle[lang]}
              </p>

              {/* Description */}
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {desc[lang]}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── „A csapatod így lát" — kampányból érkező társ-visszajelzés ── */}
      {peer && peer.raterCount > 0 ? (
        <div className="mt-6 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-caption font-semibold text-[var(--color-text-primary)]">
              {t("results.teamRolePeerTitle", locale)}
            </p>
            <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 font-mono text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
              {tf("results.teamRolePeerCount", locale, { n: peer.raterCount })}
            </span>
          </div>

          {peerReady ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {peer.topRoles.slice(0, 3).map((r, idx) => (
                  <span
                    key={r.role}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      idx === 0
                        ? "bg-[var(--color-surface-self-accent-soft)] text-[var(--color-action-primary-bg)]"
                        : "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {TEAM_ROLES[r.role as TeamRoleCode]?.[lang] ?? r.role} · {r.score}%
                  </span>
                ))}
              </div>

              {/* Önösszevetés-verdikt CSAK mért önkép mellett; becslés-ágon
                  a TeamRoleSection „nincs saját kitöltés" mintáját követjük. */}
              {peerDelta === null ? (
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {t("teamComp.peerNoSelf", locale)}
                </p>
              ) : peerDelta.selfOnly.length === 0 && peerDelta.peerOnly.length === 0 ? (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border-[1.5px] border-[var(--color-action-primary-bg)]/25 bg-[var(--color-surface-self-accent-soft)] px-4 py-3">
                  <span className="mt-0.5 text-sm">✓</span>
                  <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {t("results.teamRolePeerHarmony", locale)}
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border-[1.5px] border-[var(--color-bronze-edge)] bg-[var(--color-bronze-100)] px-4 py-3">
                  <span className="mt-0.5 text-sm">↔</span>
                  <div className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {t("results.teamRolePeerFrictionTitle", locale)}
                    </p>
                    {peerDelta.selfOnly.length > 0 ? (
                      <p className="mt-1">
                        {tf("results.teamRolePeerSelfOnly", locale, {
                          roles: roleNames(peerDelta.selfOnly),
                        })}
                      </p>
                    ) : null}
                    {peerDelta.peerOnly.length > 0 ? (
                      <p className="mt-1">
                        {tf("results.teamRolePeerPeerOnly", locale, {
                          roles: roleNames(peerDelta.peerOnly),
                        })}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-note text-[var(--color-text-muted)]">
                      {t("results.teamRolePeerFrictionHint", locale)}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {tf("results.teamRolePeerThreshold", locale, {
                n: peer.raterCount,
                min: TEAM_ROLE_PEER_MIN_RATERS,
              })}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
