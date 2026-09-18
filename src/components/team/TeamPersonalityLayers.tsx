"use client";

import { useState } from "react";
import { HEXACO_ORDER, HEXACO_DIMENSIONS, type HexacoCode } from "@/lib/hexaco";
import { COMPOSITION_AXES, type CompositionSnapshot } from "@/lib/team-operating-style/comparison";
import { t, type Locale } from "@/lib/i18n";

export const COMPOSITION_SOURCES: Record<(typeof COMPOSITION_AXES)[number], HexacoCode[]> = {
  drive: ["X"], cohesion: ["H", "A"], discipline: ["C"], openness: ["O"],
};
const valid = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
export function TeamPersonalityLayers({ composition, averages, spread, count, locale, sourceLabel }: {
  sourceLabel?: string; composition?: CompositionSnapshot | null; averages?: Record<string, number> | null;
  spread?: Record<string, number> | null; count?: number; locale: Locale; legacyPattern?: string | null;
}) {
  const [selected, setSelected] = useState<(typeof COMPOSITION_AXES)[number]>("cohesion");
  const hu = locale === "hu";
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const num = (v: number) => v.toLocaleString(hu ? "hu-HU" : "en-GB", { maximumFractionDigits: 1 });
  const dims = HEXACO_ORDER.filter((dim) => valid(averages?.[dim]));
  const source = COMPOSITION_SOURCES[selected];
  return <>
    <section className="py-7">
      {sourceLabel && <p className="mb-4 rounded-lg border border-sand p-3 text-xs text-muted">{sourceLabel}</p>}
      <div className="grid gap-7 md:grid-cols-[1fr_1.4fr]">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-sage">{hu ? "02 / Aggregált személyiség" : "02 / Aggregated personality"}</p><h2 className="mt-3 font-fraunces text-2xl text-ink sm:text-3xl">{hu ? "Miből épül fel a csapat?" : "What is the team made of?"}</h2><p className="mt-4 text-sm leading-relaxed text-ink-body">{hu ? "Az egyéni HEXACO-profilok összesítése. A közös átlag nem jelenti azt, hogy mindenki egyforma." : "Aggregated individual HEXACO profiles. A shared average does not mean everyone is alike."}</p>{typeof count === "number" && dims.length > 0 && <p className="mt-3 text-xs text-muted">{hu ? `${count} egyéni profil` : `${count} individual profiles`}</p>}</div>
        {dims.length > 0 ? <div><div className="space-y-2">{dims.map((dim) => {
          const value = averages![dim];
          const sd = spread?.[dim];
          const hasSd = typeof sd === "number" && Number.isFinite(sd) && sd >= 0;
          const start = hasSd ? Math.max(0, value - sd) : value;
          const end = hasSd ? Math.min(100, value + sd) : value;
          const active = !!composition && source.includes(dim);
          return <div key={dim} data-dimension={dim} data-highlighted={active} className={`grid grid-cols-[minmax(0,1fr)_minmax(70px,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 ${active ? "bg-sage-soft" : ""}`}>
            <span className="text-xs text-ink"><b className="mr-2 font-medium text-sage">{dim}</b>{HEXACO_DIMENSIONS[dim][locale]}</span>
            <div role="img" aria-label={`${HEXACO_DIMENSIONS[dim][locale]}: ${num(value)}/100${hasSd ? ` · ${tr("sd")}: ${num(sd)}` : ""}`} className="relative mx-1.5 h-1.5 rounded-full bg-sand">
              {hasSd && <span aria-hidden="true" className="absolute h-full rounded-full bg-sage/30" style={{ left: `${start}%`, width: `${end - start}%` }} />}
              <span aria-hidden="true" className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage" style={{ left: `${value}%` }} />
            </div><span className="text-xs tabular-nums text-ink">{num(value)}</span>
          </div>;
        })}</div><p className="mt-3 text-xs leading-relaxed text-muted">{hu ? "0–100 skála · Pont: átlag. Ahol rendelkezésre áll, a halvány sáv az átlag körüli egy mintaszórást jelzi, a skála határainál levágva; nem konfidenciaintervallum." : "0–100 scale · Dot: mean. Where available, the faint band shows one sample SD around the mean, clipped to the scale; it is not a confidence interval."}</p></div> : <p className="text-sm text-muted">{hu ? "Ebben a riportpillanatképben nincs összesített HEXACO-profil. A hiányzó értékeket nem becsüljük vissza a négy tengelyből." : "This report snapshot contains no aggregated HEXACO profile. Missing values are not reconstructed from the four axes."}</p>}
      </div>
    </section>
    <section className="py-7">
      {sourceLabel && <p className="mb-4 rounded-lg border border-sand p-3 text-xs text-muted">{sourceLabel}</p>}
      <p className="text-xs font-semibold uppercase tracking-widest text-sage">{hu ? "03 / A személyiségprofilból képzett négy tengely" : "03 / Four axes derived from personality"}</p><h2 className="mt-3 font-fraunces text-2xl text-ink sm:text-3xl">{hu ? "Milyen hajlamokból építkezhettek?" : "Which tendencies can you build on?"}</h2>
      {composition ? <><p className="mt-3 text-xs text-muted">{hu ? `${composition.memberCount} profil · Válassz egy tengelyt a forrása megismeréséhez.` : `${composition.memberCount} profiles · Select an axis to see its source.`}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{COMPOSITION_AXES.map((axis) => <button type="button" key={axis} aria-pressed={selected === axis} onClick={() => setSelected(axis)} className={`rounded-xl border p-4 text-left text-ink ${selected === axis ? "border-sage bg-sage-soft" : "border-sand bg-cream hover:border-sage"}`}><span className="block text-sm font-medium">{tr(axis)}</span><span className="mt-2 block font-fraunces text-3xl">{num(composition.axes[axis].mean)}<span className="font-sans text-xs text-muted"> /100</span></span><span className="mt-2 block text-xs text-muted">{COMPOSITION_SOURCES[axis].map((dim) => HEXACO_DIMENSIONS[dim][locale]).join(" + ")}</span></button>)}</div>
        <div aria-live="polite" className="mt-4 space-y-2 text-sm leading-relaxed text-ink-body"><p>{tr(selected)}: {source.map((dim) => HEXACO_DIMENSIONS[dim][locale]).join(" + ")}{selected === "cohesion" ? (hu ? " — tagonkénti átlag, majd csapatátlag." : " — averaged within each member, then across the team.") : (hu ? " — csapatátlag." : " — team mean.")}</p><p>{t(`tos.report.grades.${composition.axes[selected].grade}`, locale)}</p></div>
        <p className="mt-4 text-xs leading-relaxed text-muted">{tr("cohesionCaveat")}</p><p className="mt-2 text-xs leading-relaxed text-muted">{hu ? "A Hajtóerő társas aktivitást közelít; a Fegyelem rendszerezettségi hajlamot. A személyiségbeli Nyitottság nem azonos az adaptív megvalósítással. Az Emocionalitás nem vesz részt ebben a négytengelyes képzésben." : "Drive approximates social activity; Discipline reflects a tendency toward organization. Personality Openness is not the same as adaptive implementation. Emotionality does not enter this four-axis derivation."}</p>
        {composition.stability !== "stabil" && <p className="mt-5 border-t border-sand pt-4 text-xs text-muted">{tr("compositionTentative")}</p>}
      </> : <p className="mt-4 text-sm text-muted">{tr("noComposition")}</p>}
    </section>
  </>;
}
