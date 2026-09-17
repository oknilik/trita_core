"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useSearchParams } from "next/navigation";
import { OPERATING_CATALOGUE, OPERATING_FAMILIES } from "@/lib/team-operating-style/catalogue";
import { AXES, AXIS_LABELS } from "@/lib/team-operating-style/questions";
import { OperatingPatternMark } from "@/components/team/OperatingPatternMark";

const patterns = Object.entries(OPERATING_CATALOGUE).sort(([a], [b]) => a.localeCompare(b));
export function OperatingPatternExplorer() {
  const params = useSearchParams();
  const { locale: preferredLocale } = useLocale();
  const locale = params.get("lang") === "en" ? "en" : params.get("lang") === "hu" ? "hu" : preferredLocale;
  const hu = locale === "hu";
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = patterns.find(([, p]) => p.code === (chosen ?? params.get("pattern"))) ?? patterns.find(([, p]) => p.code === "IEDA")!;
  const [key, pattern] = selected;
  const family = OPERATING_FAMILIES.find((f) => pattern.code.startsWith(f.code))!;
  function choose(code: string) {
    setChosen(code);
    const url = new URL(window.location.href);
    url.searchParams.set("pattern", code);
    window.history.replaceState(null, "", url);
  }
  return <main className="bg-cream px-4 pb-16 pt-10 text-ink sm:px-6 sm:pt-16">
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 grid items-center gap-8 md:grid-cols-[1fr_160px]">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-sage">{hu ? "Csapatmintázatok" : "Team patterns"}</p>
          <h1 className="mt-4 font-fraunces text-4xl leading-tight tracking-tight sm:text-5xl">{hu ? "A közös munkánknak mintázatai vannak, amelyeket együtt alakítunk." : "Our shared work has patterns that we shape together."}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-body">{hu ? "A trita tizenhat működési kategóriát mér – fedezzétek fel, hogyan áramlik a csapatotokban az információ, hogyan hangoljátok össze a közös munkát, hol és hogyan születnek meg a döntéseitek, és hogyan valósítjátok meg a kitűzött célokat." : "trita measures sixteen operating categories – discover how information flows within your team, how you coordinate your shared work, where and how you make decisions, and how you achieve your goals."}</p>
        </div><OperatingPatternMark code="SODA" className="hidden w-36 text-ink md:grid" />
      </div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-fraunces text-2xl">{hu ? "A T16 működési mintáinak térképe" : "The T16 operating pattern map"}</h2><p className="mt-2 text-sm text-muted">{hu ? "Válassz egy mintát, és ismerd meg közelebbről." : "Choose a pattern to explore it."}</p></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OPERATING_FAMILIES.map((f) => <section key={f.code} className={`min-w-0 rounded-2xl p-3 ${f.tone}`} aria-label={f.name[locale]}>
          <div className="px-1 pb-3"><div className="flex items-center justify-between gap-2"><span className="font-fraunces text-3xl">{f.code}</span><OperatingPatternMark code={`${f.code}CP`} className="w-10 text-ink" /></div><h3 className="mt-3 text-sm font-semibold">{f.name[locale]}</h3><p className="mt-2 min-h-16 text-xs text-ink-body">{hu ? "Információ: " : "Information: "}{AXIS_LABELS.information[f.code[0] === "S" ? "left" : "right"][locale]}<br />{hu ? "Koordináció: " : "Coordination: "}{AXIS_LABELS.coordination[f.code[1] === "E" ? "left" : "right"][locale]}</p></div>
          <div className="grid gap-2">{patterns.filter(([, p]) => p.code.startsWith(f.code)).map(([, p]) => <button key={p.code} type="button" onClick={() => choose(p.code)} aria-pressed={pattern.code === p.code} aria-controls="operating-pattern-detail" className={`min-h-24 rounded-xl border-2 bg-surface-card p-3 text-left text-ink transition-colors hover:border-sage ${pattern.code === p.code ? "border-sage" : "border-transparent"}`}><span className="flex justify-between gap-1 text-sm font-semibold tracking-wide">{p.code}{pattern.code === p.code && <span aria-hidden="true" className="text-sage">✓</span>}</span><span className="mt-2 block text-xs leading-relaxed">{p.name[locale]}</span></button>)}</div>
        </section>)}
      </div>
      <section id="operating-pattern-detail" aria-live="polite" aria-atomic="true" className="mt-6 rounded-2xl border border-sand bg-surface-card p-5 sm:p-8">
        <div className="grid gap-7 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-widest text-sage">{pattern.code} · {family.name[locale]}</p><h2 className="mt-3 font-fraunces text-3xl">{pattern.name[locale]}</h2><p className="mt-4 text-sm leading-relaxed text-ink-body">{pattern.description[locale]}</p></div><dl className="divide-y divide-sand">{AXES.map((axis, i) => <div key={axis} className="py-3 first:pt-0"><dt className="flex flex-wrap justify-between gap-2 text-sm"><span>{AXIS_LABELS[axis].name[locale]}</span><strong className="font-semibold">{pattern.code[i]} · {AXIS_LABELS[axis][key[i] === "0" ? "left" : "right"][locale]}</strong></dt></div>)}</dl></div>
        {hu && <p className="mt-6 border-t border-sand pt-4 text-xs leading-relaxed text-muted"><strong>Előfordulhat például: </strong>{pattern.examples.join(" · ")}. A közeg önmagában nem határozza meg a mintát.</p>}
      </section>
      <details className="mt-7 border-t border-sand pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">{hu ? "Hogyan olvasd ezt a térképet?" : "How to read this map"}</summary><div className="max-w-3xl space-y-3 text-sm leading-relaxed text-ink-body"><p>{hu ? "A kód sorrendje: információ → koordináció → döntés → végrehajtás. Az első két betű adja a családot. A családon belül a döntési jogkör és a megvalósítás módja különbözteti meg a négy mintát." : "The code order is information → coordination → decision → execution. The first two letters define the family; decision authority and execution distinguish its four patterns."}</p><p>{hu ? "A csapatkép az adott időszak működését írja le. Nem személyiségtípus vagy rangsor. A személyiségi összetétel külön réteg. Az organikus koordináció önmagában nem jelent elosztott döntést." : "This describes how a team operates during a particular period, not a personality type or ranking. Personality composition is a separate layer. Organic coordination alone does not imply distributed decisions."}</p><p>{hu ? "A mért tengelyek folytonosak. A középhez közeli, megosztott vagy hiányos eredményeket a riport külön jelzi. A modell kísérleti, nem validált tipológia." : "Measured axes are continuous. Near-midpoint, divergent or incomplete results are flagged in the report. This is an experimental, unvalidated typology."}</p></div></details>
    </div>
  </main>;
}
