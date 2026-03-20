"use client";

import { useState, useEffect } from "react";
import { PATTERN_NAMES } from "@/lib/team-pattern";

// Tier mapping from getPlanTier() in src/lib/subscription.ts:
//   none / trialing  → "trial"      (no or trial subscription)
//   "team"           → "essentials" (platform access, no consultation)
//   "org"            → "advisory"   (platform + quarterly consultation)
//   "scale"          → "custom"     (bespoke programme)
export type AdvisoryTier = "trial" | "essentials" | "advisory" | "custom" | "none";

interface TeamInfo {
  id: string;
  name: string;
  memberCount: number;
}

interface TeamPatternSummary {
  teamId: string;
  patternCode: string;
  patternName: string;
  diversitySuffix: string;
}

interface Props {
  userName: string;
  orgName: string;
  tier: AdvisoryTier;
  isHu: boolean;
  teams: TeamInfo[];
}

export function AdvisoryPageClient({ userName, orgName, tier, isHu, teams }: Props) {
  const [patterns, setPatterns] = useState<TeamPatternSummary[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(teams.length > 0);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const firstName = userName.split(/[\s@]/)[0] ?? userName;

  const isAdvisory = tier === "advisory" || tier === "custom";
  const isUpgrade = tier === "trial" || tier === "essentials" || tier === "none";

  useEffect(() => {
    if (teams.length === 0) {
      setLoadingPatterns(false);
      return;
    }
    Promise.all(
      teams.map((t) =>
        fetch(`/api/team/${t.id}/pattern`)
          .then((r) => r.json())
          .then((data) => {
            const pr = data.patternResult;
            if (!pr) return null;
            return {
              teamId: t.id,
              patternCode: pr.patternCode,
              patternName: pr.patternName,
              diversitySuffix: pr.diversitySuffix,
            } as TeamPatternSummary;
          })
          .catch(() => null)
      )
    ).then((results) => {
      setPatterns(results.filter(Boolean) as TeamPatternSummary[]);
      setLoadingPatterns(false);
    });
  }, [teams]);

  const handleRequestConsultation = async () => {
    setRequestLoading(true);
    try {
      const res = await fetch("/api/advisory/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: patterns.map((p) => ({
            name: teams.find((t) => t.id === p.teamId)?.name ?? "",
            pattern: p.patternName,
          })),
        }),
      });
      if (res.ok) setRequestSent(true);
    } finally {
      setRequestLoading(false);
    }
  };

  const firstPattern = patterns[0];
  const secondPattern = patterns[1];
  const firstContent = firstPattern ? PATTERN_NAMES[firstPattern.patternCode] : null;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
          // {isHu ? "tanácsadói konzultáció" : "advisory consultation"}
        </p>
        <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">
          {isAdvisory
            ? isHu
              ? `${firstName}, a csapataid készen állnak a következő lépésre.`
              : `${firstName}, your teams are ready for the next step.`
            : isHu
            ? "Lásd, amit az adatok nem mondanak el."
            : "See what the data doesn't tell you."}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5a5650]">
          {isAdvisory
            ? isHu
              ? "A negyedéves tanácsadói konzultáción személyesen értelmezzük a csapataid mintázatait, és konkrét akcióterveket dolgozunk ki."
              : "In the quarterly advisory consultation we personally interpret your team patterns and develop concrete action plans."
            : isHu
            ? "A személyiségmérési adatok mutatják a mintázatot. A tanácsadói konzultáción megértjük, miért — és megtervezzük, mit lépj."
            : "The personality assessment data shows the pattern. The advisory consultation helps you understand why — and plan what to do next."}
        </p>
      </div>

      {/* ── A te csapataid most ────────────────────────────── */}
      {!loadingPatterns && patterns.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-playfair text-xl text-[#1a1814]">
            {isHu ? "A te csapataid most" : "Your teams right now"}
          </h2>
          <div className="flex flex-col gap-3">
            {patterns.map((p) => {
              const team = teams.find((t) => t.id === p.teamId);
              return (
                <div
                  key={p.teamId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-[#1a1814]">{team?.name}</p>
                    <p className="mt-0.5 text-sm text-[#5a5650]">
                      {p.patternName}
                      {p.diversitySuffix ? ` — ${p.diversitySuffix}` : ""}
                      <span className="mx-2 text-[#e8e4dc]">·</span>
                      {team?.memberCount} {isHu ? "fő" : "members"}
                    </p>
                  </div>
                  <a
                    href={`/team/${p.teamId}`}
                    className="shrink-0 text-sm font-semibold text-[#c8410a] transition-colors hover:text-[#b53a09]"
                  >
                    {isHu ? "Részletek →" : "Details →"}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mit kapsz a konzultáción ──────────────────────── */}
      <div className="mb-10">
        <h2 className="mb-2 font-playfair text-xl text-[#1a1814]">
          {isHu
            ? "Mit kapsz a tanácsadói konzultáción"
            : "What you get in the advisory consultation"}
        </h2>
        <p className="mb-6 text-sm text-[#5a5650]">
          {isHu
            ? "A konzultáció szervezeti szintű — nem egy csapatról szól, hanem arról, hogyan működnek a csapataid együtt és külön-külön."
            : "The consultation is org-level — not about one team, but how your teams work together and individually."}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ConsultationFeature
            number="01"
            title={isHu ? "Szervezeti hőtérkép" : "Organisational heat map"}
            description={
              isHu
                ? "Átnézzük az összes csapatod mintázatát együtt: hol van összhang a csapatok között, hol vannak szervezeti szintű feszültségek, és melyik csapat mintázata jelent kockázatot a stratégiátok szempontjából."
                : "We review all your team patterns together: where there is alignment, where there are org-level tensions, and which pattern poses a strategic risk."
            }
            example={
              secondPattern
                ? isHu
                  ? `Például: a \u201E${firstPattern!.patternName}\u201D és a \u201E${secondPattern.patternName}\u201D csapatok közötti dinamika értelmezése.`
                  : `E.g.: interpreting the dynamics between the \u201C${firstPattern!.patternName}\u201D and \u201C${secondPattern.patternName}\u201D teams.`
                : firstPattern
                ? isHu
                  ? `Például: a \u201E${firstPattern.patternName}\u201D mintázat szervezeti hatásai és rejtett kockázatai.`
                  : `E.g.: the organisational impact and hidden risks of the \u201C${firstPattern.patternName}\u201D pattern.`
                : undefined
            }
          />
          <ConsultationFeature
            number="02"
            title={isHu ? "Cross-team feszültségek" : "Cross-team tensions"}
            description={
              isHu
                ? "Azonosítjuk, hol ütköznek a csapatok működési mintázatai — és hol éppen a különbözőség az erő. Ez az, amit a platform önmagában nem tud megmutatni."
                : "We identify where team operating patterns clash — and where the difference is actually a strength. This is what the platform alone can't show."
            }
            example={
              isHu
                ? "Például: miért kommunikál nehezen a sales és a product csapat, és mit léphetsz vezetőként."
                : "E.g.: why the sales and product teams struggle to communicate, and what you can do as a leader."
            }
          />
          <ConsultationFeature
            number="03"
            title={isHu ? "Szervezeti akcióterv" : "Organisational action plan"}
            description={
              isHu
                ? "3-5 konkrét, végrehajtható lépés a következő negyedévre — nem csapatszintű tippek, hanem szervezeti döntések: kit hova rendelj, hol változtass folyamatot, hol avatkozz be személyesen."
                : "3-5 concrete, executable steps for the next quarter — not team-level tips, but organisational decisions: who goes where, where to change process, where to intervene personally."
            }
            example={
              firstContent?.leaderActions?.[0]
                ? `${isHu ? "Például" : "E.g."}: \u201E${firstContent.leaderActions[0]}\u201D`
                : undefined
            }
          />
          <ConsultationFeature
            number="04"
            title={isHu ? "Írásos összefoglaló + csapat-riportok" : "Written summary + team reports"}
            description={
              isHu
                ? "48 órán belül kapsz egy PDF-et: szervezeti hőtérkép vizualizáció, csapatonkénti 2-3 soros értékelés, a megbeszélt akciók listája felelőssel és határidővel, és a következő mérési pont javaslat."
                : "Within 48 hours you receive a PDF: org heat map visualisation, 2-3 sentence team-by-team evaluation, action list with owners and deadlines, and next measurement point recommendation."
            }
          />
        </div>
      </div>

      {/* ── Hogyan működik a negyedéves konzultáció ──────── */}
      <div className="mb-10 rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 font-playfair text-xl text-[#1a1814]">
          {isHu
            ? "Hogyan működik a negyedéves konzultáció"
            : "How the quarterly consultation works"}
        </h2>

        {/* 3 fázis */}
        <div className="mb-8 space-y-6">
          {(isHu
            ? [
                {
                  n: "1",
                  title: "Előkészítés (aszinkron)",
                  body: "Átnézzük a szervezeted összes csapatának mintázatát, a cross-team feszültségeket, és a változásokat az előző negyedévhez képest. Ebből készül a szervezeti hőtérkép, ami a konzultáció kiindulópontja.",
                },
                {
                  n: "2",
                  title: "Stratégiai session (90 perc, online)",
                  body: "Személyes videóhívás veled (vezető / HR). Szervezeti szintű mintázat-értelmezés, cross-team dinamikák, feszültségpontok okai, 3-5 konkrét akció a következő negyedévre. Ha van konkrét kérdésed — arra mélyen válaszolunk.",
                },
                {
                  n: "3",
                  title: "Írásos összefoglaló (48 órán belül)",
                  body: "PDF dokumentum: szervezeti hőtérkép, csapatonkénti rövid értékelés, a megbeszélt akciók listája felelőssel és határidővel, következő mérési pont javaslat. Azonnal továbbítható a menedzsment meetingre.",
                },
              ]
            : [
                {
                  n: "1",
                  title: "Preparation (async)",
                  body: "We review all your org's team patterns, cross-team tensions, and changes since the last quarter. This produces the org heat map that serves as the consultation's starting point.",
                },
                {
                  n: "2",
                  title: "Strategy session (90 min, online)",
                  body: "Personal video call with you (leader / HR). Org-level pattern interpretation, cross-team dynamics, root causes of tension points, 3-5 concrete actions for the next quarter. If you have a specific question — we go deep.",
                },
                {
                  n: "3",
                  title: "Written summary (within 48 hours)",
                  body: "PDF document: org heat map, short team-by-team evaluation, action list with owners and deadlines, next measurement point recommendation. Ready to share in your next management meeting.",
                },
              ]
          ).map(({ n, title, body }) => (
            <div key={n} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c8410a]/10 font-playfair text-sm font-medium text-[#c8410a]">
                {n}
              </span>
              <div>
                <p className="mb-1 text-sm font-semibold text-[#1a1814]">{title}</p>
                <p className="text-sm text-[#5a5650]">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add-on */}
        <div className="border-t border-[#e8e4dc] pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[#1a1814]">
                {isHu ? "Csapat deep-dive session" : "Team deep-dive session"}
              </p>
              <p className="text-xs text-[#a09a90]">
                {isHu
                  ? "Ha egy konkrét csapat mélyebb elemzést igényel — személyre szabott 60 perces session a csapatmenedzserrel."
                  : "If a specific team needs deeper analysis — a personalised 60-minute session with the team manager."}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[#1a1814]">
              + €200 / {isHu ? "alkalom" : "session"}
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA — advisory / custom ──────────────────────── */}
      {isAdvisory && !requestSent && (
        <div className="mb-10 rounded-2xl border border-[#c8410a]/20 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
            // {tier === "custom"
              ? isHu ? "egyedi program" : "custom programme"
              : isHu ? "advisory csomag" : "advisory plan"}
          </p>
          <h2 className="mb-3 font-playfair text-2xl text-[#1a1814]">
            {tier === "custom"
              ? isHu ? "Egyeztessünk időpontot" : "Let's schedule a session"
              : isHu ? "Kérd a következő negyedéves konzultációt" : "Request your next quarterly consultation"}
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-sm text-[#5a5650]">
            {tier === "custom"
              ? isHu
                ? "Az egyedi programod keretében személyre szabott ütemtervet dolgozunk ki — kattints, és koordinálunk."
                : "Within your custom programme we create a bespoke schedule — click and we'll coordinate."
              : isHu
              ? "Az Advisory csomagod tartalmazza a negyedéves szervezeti szintű tanácsadói konzultációt. Kattints az alábbi gombra, és 24 órán belül egyeztetünk időpontot. A csapataid adatai automatikusan rendelkezésre állnak — nem kell semmit előkészítened."
              : "Your Advisory plan includes the quarterly org-level consultation. Click and we'll confirm a time within 24 hours. Your team data is automatically available — no preparation needed."}
          </p>
          <button
            onClick={handleRequestConsultation}
            disabled={requestLoading}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {requestLoading
              ? isHu ? "Küldés..." : "Sending..."
              : isHu ? "Konzultációt kérek →" : "Request consultation →"}
          </button>
        </div>
      )}

      {isAdvisory && requestSent && (
        <div className="mb-10 rounded-2xl border border-[#e8e4dc] bg-white p-8 text-center shadow-sm">
          <p className="mb-3 font-playfair text-3xl text-[#c8410a]">✦</p>
          <h2 className="mb-2 font-playfair text-2xl text-[#1a1814]">
            {isHu ? "Megkaptuk a kérésed!" : "We received your request!"}
          </h2>
          <p className="text-sm text-[#5a5650]">
            {isHu
              ? "24 órán belül személyesen kereslek az időpont-egyeztetéssel."
              : "We'll reach out within 24 hours to schedule a time."}
          </p>
        </div>
      )}

      {/* ── CTA — upgrade ────────────────────────────────── */}
      {isUpgrade && (
        <div className="mb-10 rounded-2xl border-2 border-[#c8410a]/20 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
                // advisory
              </p>
              <h2 className="mb-3 font-playfair text-2xl text-[#1a1814]">
                Trita Advisory
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-[#5a5650]">
                {isHu
                  ? "Negyedéves személyes tanácsadói konzultáció + teljes platform hozzáférés. A csapatod adataiból konkrét, végrehajtható akcióterveket készítünk együtt."
                  : "Quarterly personal advisory consultation + full platform access. We build concrete, executable action plans from your team data together."}
              </p>
              <ul className="mb-6 space-y-2 text-sm text-[#5a5650]">
                {(isHu
                  ? [
                      "Negyedéves 90 perces szervezeti szintű tanácsadói konzultáció",
                      "Szervezeti hőtérkép + csapatonkénti írásos értékelés (PDF)",
                      "Cross-team dinamikák és feszültségpontok elemzése",
                      "3-5 konkrét szervezeti szintű akcióterv negyedévenként",
                      "Teljes platform hozzáférés (heatmap, mintázat, tension pair)",
                      "Opcionális csapat deep-dive session (+€200/alkalom)",
                    ]
                  : [
                      "Quarterly 90-minute org-level advisory consultation",
                      "Org heat map + written team-by-team evaluation (PDF)",
                      "Cross-team dynamics and tension point analysis",
                      "3-5 concrete org-level action plans per quarter",
                      "Full platform access (heatmap, pattern, tension pair)",
                      "Optional team deep-dive session (+€200/session)",
                    ]
                ).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0 text-[#c8410a]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-playfair text-3xl text-[#1a1814]">€149</span>
                <span className="text-sm text-[#5a5650]">
                  {isHu ? "/hó + €400/negyedév" : "/mo + €400/quarter"}
                </span>
              </div>
              {tier === "trial" && (
                <p className="mb-4 text-xs font-semibold text-[#c8410a]">
                  {isHu
                    ? "Founding customer? Az első 10 ügyfélnek €99/hó, örökre."
                    : "Founding customer? €99/mo forever for the first 10 clients."}
                </p>
              )}
              <a
                href="/billing/upgrade"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-8 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
              >
                {isHu ? "Váltás Advisory-ra →" : "Upgrade to Advisory →"}
              </a>
            </div>
            <div className="hidden md:block">
              <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-6 text-center">
                <p className="text-sm italic leading-relaxed text-[#5a5650]">
                  {isHu
                    ? "\u201EA konzultáción végre megértettem, miért van feszültség a sales és a product csapat között — és kaptam 3 konkrét lépést, amit azonnal elkezdtünk.\u201D"
                    : "\u201CAt the consultation I finally understood why there was tension between the sales and product teams — and I got 3 concrete steps we started immediately.\u201D"}
                </p>
                <p className="mt-3 text-xs text-[#a09a90]">
                  {isHu ? "— Egy jövőbeli founding customer" : "— A future founding customer"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ ──────────────────────────────────────────── */}
      <div className="mt-4 border-t border-[#e8e4dc] pt-10">
        <h2 className="mb-6 font-playfair text-xl text-[#1a1814]">
          {isHu ? "Gyakori kérdések" : "Frequently asked questions"}
        </h2>
        <div className="space-y-3">
          {(isHu
            ? [
                [
                  "Kell valamit előkészítenem a konzultáció előtt?",
                  "Nem — a szervezeted összes csapatának mérési adatai, mintázatai és tension pair-jei automatikusan rendelkezésre állnak. Ha van konkrét kérdésed vagy helyzeted, azt előre jelezheted, de nem kötelező.",
                ],
                [
                  "A konzultáció az egész szervezetről szól, vagy egy csapatról?",
                  "A negyedéves konzultáció szervezeti szintű: az összes csapat mintázatát áttekintjük, a cross-team dinamikákat, és szervezeti szintű akcióterveket készítünk. Ha egy konkrét csapat mélyebb elemzést igényel, ahhoz csapat deep-dive session foglalható (+€200/alkalom).",
                ],
                [
                  "Ki vesz részt a konzultáción?",
                  "Általában te (vezető, HR, vagy az ügyvezető) és a Trita tanácsadó. A csapatmenedzsereket nem kell bevonni — ők a platformon kapják meg a saját csapatuk insight-jait.",
                ],
                [
                  "Mit kapok a konzultáció után?",
                  "48 órán belül egy írásos összefoglalót és akciótervet küldünk PDF-ben: szervezeti hőtérkép, csapatonkénti rövid értékelés, a megbeszélt akciók felelőssel és határidővel, és a következő mérési pont javaslat. Azonnal továbbítható a menedzsment meetingre.",
                ],
                [
                  "Milyen gyakran van konzultáció?",
                  "Az Advisory csomagban negyedévente 1 szervezeti szintű session. Ezen felül csapat deep-dive session-ök és extra szervezeti session-ök igény szerint foglalhatók.",
                ],
                [
                  "Mi történik, ha az Essentials csomagom van?",
                  "Az Essentials csomag a platform teljes hozzáférését adja — csapatminta, heatmap, tension pair —, de nem tartalmaz személyes tanácsadói konzultációt. Az Advisory csomagra bármikor válthatál, a különbözet prorated.",
                ],
              ]
            : [
                [
                  "Do I need to prepare anything?",
                  "No — all your org's teams' assessment data, patterns and tension pairs are automatically available. If you have a specific question or situation, you can flag it in advance, but it's not required.",
                ],
                [
                  "Is the consultation about the whole org or one team?",
                  "The quarterly consultation is org-level: we review all team patterns, cross-team dynamics, and create org-level action plans. If a specific team needs deeper analysis, a team deep-dive session can be booked (+€200/session).",
                ],
                [
                  "Who participates in the consultation?",
                  "Usually you (leader, HR, or CEO) and the Trita advisor. Team managers don't need to join — they receive their team's insights directly through the platform.",
                ],
                [
                  "What do I receive after the consultation?",
                  "Within 48 hours we send a written summary and action plan PDF: org heat map, short team-by-team evaluation, action list with owners and deadlines, and next measurement point recommendation. Ready to share in your next management meeting.",
                ],
                [
                  "How often is the consultation?",
                  "The Advisory plan includes one org-level session per quarter. Additional team deep-dive and extra org sessions can be booked on request.",
                ],
                [
                  "What if I'm on the Essentials plan?",
                  "The Essentials plan gives full platform access — team pattern, heatmap, tension pair — but doesn't include personal advisory consultations. You can upgrade to Advisory at any time, billed prorated.",
                ],
              ]
          ).map(([q, a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function ConsultationFeature({
  number,
  title,
  description,
  example,
}: {
  number: string;
  title: string;
  description: string;
  example?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-sm text-[#c8410a]/50">{number}</span>
        <h3 className="font-semibold text-[#1a1814]">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-[#5a5650]">{description}</p>
      {example && (
        <p className="mt-3 text-xs italic text-[#c8410a]/70">{example}</p>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-[#e8e4dc] bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-[#1a1814] transition-colors hover:text-[#c8410a]">
        <span className="shrink-0 font-mono text-[#c8410a]/50 transition-transform group-open:rotate-90">
          ›
        </span>
        {q}
      </summary>
      <p className="px-5 pb-4 text-sm leading-relaxed text-[#5a5650]">{a}</p>
    </details>
  );
}
