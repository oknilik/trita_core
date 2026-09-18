import { AXES, AXIS_LABELS, type Localized } from "@/lib/team-operating-style/questions";
import type { Locale } from "@/lib/i18n";

const descriptions: Record<string, Localized> = {
  S: { hu: "A tudás rendezett, a fontos információk visszakereshetők.", en: "Knowledge is organized and important information can be retrieved." },
  I: { hu: "Az információ közvetlen beszélgetéseken és kötetlen üzeneteken keresztül áramlik.", en: "Information flows through direct conversations and informal messages." },
  E: { hu: "Kimondott felelősségek és egyeztetett átadások hangolják össze a munkát.", en: "Explicit responsibilities and agreed handovers coordinate the work." },
  O: { hu: "Kialakult szokások és egymás munkájának követése hangolják össze a munkát.", en: "Shared routines and awareness of each other's progress coordinate the work." },
  C: { hu: "A fő döntések egy központi ponton születnek meg.", en: "Key decisions are made at a central point." },
  D: { hu: "A döntések több ponton, a csapattagok saját hatáskörében születnek.", en: "Decisions are made across the team within members' own authority." },
  P: { hu: "A megvalósítás előre egyeztetett lépések és ütemezés mentén halad.", en: "Work follows steps and a schedule agreed in advance." },
  A: { hu: "A megvalósítás menet közben, a helyzethez igazodva alakul.", en: "Implementation adapts to the situation as work progresses." },
};
const tones = [
  "bg-bronze-soft text-bronze-dark",
  "bg-sage-soft text-sage-dark",
  "bg-[var(--color-layer-org-soft)] text-[var(--color-layer-org-accent)]",
  "bg-[var(--color-layer-team-soft)] text-[var(--color-layer-team-accent)]",
];

/** Decorative metaphors for the poles, never a score or a ranking. */
function PoleMark({ pole }: { pole: string }) {
  const marks: Record<string, React.ReactNode> = {
    S: <><rect x="5" y="30" width="21" height="30" rx="2" /><path d="M32 60V24a11 11 0 0 1 22 0v36Z" /><rect x="60" y="4" width="22" height="56" rx="2" opacity=".5" /></>,
    I: <><path d="M5 13Q5 4 17 4h26q12 0 12 12v12q0 12-12 12H25L12 50l2-13Q5 35 5 26Z" opacity=".55" /><path d="M39 32q0-9 10-9h25q12 0 12 11v13q0 11-12 11H63l-12 8 1-11q-13 0-13-12Z" /></>,
    E: <><path d="M20 20H70V49H20Z" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="7" y="5" width="27" height="25" rx="4" /><rect x="55" y="5" width="27" height="25" rx="4" opacity=".5" /><rect x="7" y="38" width="27" height="25" rx="4" opacity=".5" /><rect x="55" y="38" width="27" height="25" rx="4" /></>,
    O: <><path d="M8 29C0 10 39 7 46 30S25 68 13 56 11 38 8 29Z" /><path d="M39 8C50-4 81 6 81 23S56 46 43 34 28 20 39 8Z" opacity=".55" /><circle cx="62" cy="55" r="8" /></>,
    C: <><ellipse cx="45" cy="34" rx="37" ry="24" fill="none" stroke="currentColor" /><circle cx="45" cy="34" r="17" />{[[10,9],[79,13],[13,57],[76,57]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="7" opacity=".45" />)}</>,
    D: <><path d="M18 16 72 16 45 55Z" fill="none" stroke="currentColor" strokeWidth="2" />{[[18,16],[72,16],[45,55]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="12" />)}</>,
    P: <><path d="M12 35H78" fill="none" stroke="currentColor" strokeWidth="2" />{[7,35,63].map(x => <rect key={x} x={x} y="23" width="23" height="24" rx="3" opacity={x === 35 ? .55 : 1} />)}</>,
    A: <><path d="M10 59Q2 17 54 20" fill="none" stroke="currentColor" strokeWidth="10" /><circle cx="72" cy="14" r="11" opacity=".5" /><rect x="49" y="43" width="20" height="20" rx="3" transform="rotate(25 59 53)" /></>,
  };
  return <svg viewBox="0 0 90 70" aria-hidden="true" focusable="false" className="mt-4 h-14 w-20 fill-current">{marks[pole]}</svg>;
}

export function OperatingPatternAxes({ code, locale }: { code: string; locale: Locale }) {
  return <div className="min-w-0">
    <h3 className="mb-4 font-fraunces text-2xl text-ink">{locale === "hu" ? "Így áll össze a mintázat" : "How the pattern comes together"}</h3>
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
      {AXES.map((axis, index) => {
        const pole = code[index];
        const selected = "SECP"[index] === pole ? "left" : "right";
        const labels = AXIS_LABELS[axis];
        return <div key={axis} className={`flex min-w-0 flex-col rounded-2xl p-4 ${tones[index]}`}>
          <dt className="flex items-center gap-2 text-xs font-medium"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-card font-semibold">{pole}</span>{labels.name[locale]}</dt>
          <dd className="flex flex-1 flex-col">
            <PoleMark pole={pole} />
            <p className="mt-3 break-words font-fraunces text-2xl text-ink">{labels[selected][locale]}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-body">{descriptions[pole]?.[locale]}</p>
            <div className="mt-auto pt-4"><div className="flex flex-wrap gap-1 border-t border-current/15 pt-3 text-xs">
              {(["left", "right"] as const).map(side => <span key={side} className={`rounded-md px-2 py-1.5 ${side === selected ? "bg-surface-card font-semibold" : "text-muted"}`}>
                {side === selected && <span className="sr-only">{locale === "hu" ? "Erre a mintára jellemző: " : "This pattern: "}</span>}{labels[side][locale]}
              </span>)}
            </div></div>
          </dd>
        </div>;
      })}
    </dl>
  </div>;
}
