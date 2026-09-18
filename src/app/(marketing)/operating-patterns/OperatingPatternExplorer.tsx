"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { useSearchParams } from "next/navigation";
import { OPERATING_CATALOGUE, OPERATING_FAMILIES } from "@/lib/team-operating-style/catalogue";
import { OperatingPatternAxes } from "@/components/team/OperatingPatternAxes";
import { OperatingPatternMark } from "@/components/team/OperatingPatternMark";

import { OperatingPatternJourney } from "./OperatingPatternJourney";

const patterns = Object.entries(OPERATING_CATALOGUE).sort(([a], [b]) => a.localeCompare(b));
export function OperatingPatternExplorer() {
  const params = useSearchParams();
  const { locale: preferredLocale } = useLocale();
  const locale = params.get("lang") === "en" ? "en" : params.get("lang") === "hu" ? "hu" : preferredLocale;
  const hu = locale === "hu";
  const detailRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const catalogueRef = useRef<HTMLDetailsElement>(null);
  const requestedPattern = params.get("pattern");
  const validDeepLink = patterns.some(([, p]) => p.code === requestedPattern);
  const [expanded, setExpanded] = useState(validDeepLink);
  // A report link opens the catalogue and reveals its selected explanation.
  useEffect(() => {
    if (!validDeepLink || !catalogueRef.current) return;
    catalogueRef.current.open = true;
    const frame = window.requestAnimationFrame(() => detailRef.current?.scrollIntoView?.({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [requestedPattern, validDeepLink]);
  function explore() {
    setExpanded(true);
    window.requestAnimationFrame(() => mapRef.current?.scrollIntoView?.({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }));
  }
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = patterns.find(([, p]) => p.code === (chosen ?? params.get("pattern"))) ?? patterns.find(([, p]) => p.code === "IEDA")!;
  const [, pattern] = selected;
  const family = OPERATING_FAMILIES.find((f) => pattern.code.startsWith(f.code))!;
  function choose(code: string) {
    setChosen(code);
    const url = new URL(window.location.href);
    url.searchParams.set("pattern", code);
    window.history.replaceState(null, "", url);
    // Wait for the selected description to render, then reveal it below the sticky header.
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView?.({
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    });
  }
  return <main className="bg-cream px-4 pb-16 pt-10 text-ink sm:px-6 sm:pt-16">
    <div className="mx-auto max-w-5xl">
      <OperatingPatternJourney locale={locale} onExplore={explore} />
      <section ref={mapRef} id="operating-map" aria-labelledby="operating-map-title" className="scroll-mt-28">
        <p className="text-xs font-semibold uppercase tracking-widest text-sage">{hu ? "A beszélgetéshez egy közös térkép" : "A shared map for the conversation"}</p>
        <h2 id="operating-map-title" className="mt-3 max-w-2xl font-fraunces text-3xl tracking-tight">{hu ? "Milyen működési minták rajzolódhatnak ki?" : "What operating patterns might emerge?"}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-body">{hu ? "A T16 négy területet vizsgál: az információáramlást, a koordinációt, a döntéshozatalt és a megvalósítást. Ezekből tizenhat működési minta áll össze." : "T16 explores four areas: information flow, coordination, decision-making and implementation. These combine into sixteen operating patterns."}</p>
        <div className="mb-4 mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {OPERATING_FAMILIES.map((f) => <div key={f.code} className={`min-w-0 rounded-2xl p-4 ${f.tone}`}>
            <div className="flex items-center justify-between gap-2"><span className="font-fraunces text-3xl">{f.code}</span><OperatingPatternMark code={`${f.code}CP`} className="w-10 text-ink" /></div>
            <h3 className="mt-3 break-words text-sm font-semibold">{f.name[locale]}</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-body">{hu
              ? `${f.code[0] === "S" ? "Rendezett tudás" : "Közvetlen információ"}, ${f.code[1] === "E" ? "kimondott szerepek" : "kialakult összhang"}.`
              : `${f.code[0] === "S" ? "Organized knowledge" : "Direct information"}, ${f.code[1] === "E" ? "explicit roles" : "shared routines"}.`}</p>
          </div>)}
        </div>
        <details ref={catalogueRef} open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
          <summary className="min-h-11 cursor-pointer border-b border-sand py-4 text-sm font-semibold text-sage-dark">{hu ? "Felfedezem a 16 mintát" : "Explore the 16 patterns"}</summary>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OPERATING_FAMILIES.map((f) => <section key={f.code} className={`min-w-0 rounded-2xl p-3 ${f.tone}`} aria-label={f.name[locale]}>
          <h3 className="sr-only">{f.name[locale]}</h3>
          <div className="grid gap-2">{patterns.filter(([, p]) => p.code.startsWith(f.code)).map(([, p]) => <button key={p.code} type="button" onClick={() => choose(p.code)} aria-pressed={pattern.code === p.code} aria-controls="operating-pattern-detail" className={`min-h-24 rounded-xl border-2 bg-surface-card p-3 text-left text-ink transition-colors hover:border-sage ${pattern.code === p.code ? "border-sage" : "border-transparent"}`}><span className="flex justify-between gap-1 text-sm font-semibold tracking-wide">{p.code}{pattern.code === p.code && <span aria-hidden="true" className="text-sage">✓</span>}</span><span className="mt-2 block text-xs leading-relaxed">{p.name[locale]}</span></button>)}</div>
        </section>)}
      </div>
      <section ref={detailRef} id="operating-pattern-detail" aria-live="polite" aria-atomic="true" className="mt-6 scroll-mt-28 rounded-2xl border border-sand bg-surface-card p-5 sm:p-8">
        <div className="grid gap-7 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-widest text-sage">{pattern.code} · {family.name[locale]}</p><h2 className="mt-3 font-fraunces text-3xl">{pattern.name[locale]}</h2><p className="mt-4 text-sm leading-relaxed text-ink-body">{pattern.description[locale]}</p><Image src={`/illustrations/operating-patterns/${pattern.code}.svg`} alt={hu ? `${pattern.name.hu} – együttműködő csapat absztrakt figurákkal` : `${pattern.name.en} – abstract figures working together`} width={400} height={224} className="mx-auto mt-6 h-auto w-full max-w-lg" /></div><OperatingPatternAxes code={pattern.code} locale={locale} /></div>
        <p className="mt-6 text-xs leading-relaxed text-muted">{hu ? "Itt a mintákat ismerhetitek meg. A saját csapatotok képét a mérés és a közös értelmezés rajzolja ki; a név önmagában nem értékelés vagy célállapot." : "Explore the patterns here. Your team's picture emerges from measurement and shared interpretation; a name alone is neither an assessment nor a target state."}</p>
        {hu && <p className="mt-6 border-t border-sand pt-4 text-xs leading-relaxed text-muted"><strong>Előfordulhat például: </strong>{pattern.examples.join(" · ")}. A közeg önmagában nem határozza meg a mintát.</p>}
      </section>
      <details className="mt-7 border-t border-sand pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">{hu ? "Hogyan olvasd ezt a térképet?" : "How to read this map"}</summary><div className="max-w-3xl space-y-3 text-sm leading-relaxed text-ink-body"><p>{hu ? "A kód sorrendje: információáramlás → koordináció → döntéshozatal → megvalósítás. Az első két betű adja a családot. A családon belül a döntési jogkör és a megvalósítás módja különbözteti meg a négy mintát." : "The code order is information flow → coordination → decision-making → implementation. The first two letters define the family; decision authority and implementation distinguish its four patterns."}</p><p>{hu ? "A csapatkép az adott időszak működését írja le. Nem személyiségtípus vagy rangsor. A személyiségi összetétel külön réteg. Az organikus koordináció önmagában nem jelent elosztott döntést." : "This describes how a team operates during a particular period, not a personality type or ranking. Personality composition is a separate layer. Organic coordination alone does not imply distributed decisions."}</p><p>{hu ? "A mért tengelyek folytonosak. A középhez közeli, megosztott vagy hiányos eredményeket a riport külön jelzi. A modell kísérleti, nem validált tipológia." : "Measured axes are continuous. Near-midpoint, divergent or incomplete results are flagged in the report. This is an experimental, unvalidated typology."}</p></div></details>
        </details>
      </section>
    </div>
  </main>;
}
