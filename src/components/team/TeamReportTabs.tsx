"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/** Keep panels mounted: switching tabs must not discard unsaved action edits. */
export function TeamReportTabs({ overview, measurements, followUp, isHu }: {
  overview: ReactNode; measurements: ReactNode; followUp: ReactNode; isHu: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const labels = isHu ? ["Csapatkép", "Mérési háttér", "Utánkövetés"] : ["Team picture", "Measurement background", "Follow-up"];
  const select = (index: number) => { setActive(index); buttons.current[index]?.focus(); };

  return <div>
    <div role="tablist" aria-label={isHu ? "A riport nézetei" : "Report views"} className="mb-6 flex gap-5 border-b border-sand sm:gap-8">
      {labels.map((label, index) => <button key={label} ref={(el) => { buttons.current[index] = el; }}
        type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
        aria-selected={active === index} tabIndex={active === index ? 0 : -1}
        onClick={() => setActive(index)} onKeyDown={(event) => {
          const next = event.key === "ArrowRight" ? (active + 1) % 3 : event.key === "ArrowLeft" ? (active + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
          if (next !== null) { event.preventDefault(); select(next); }
        }}
        className={`min-h-12 border-b-2 py-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage ${active === index ? "border-bronze font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
        {label}
      </button>)}
    </div>
    {[overview, measurements, followUp].map((content, index) => <div key={index} role="tabpanel"
      id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== index} tabIndex={0}
      className="focus-visible:outline focus-visible:outline-sage">
      {content}
      {index === 0 && <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-sand pt-3">
        <button type="button" onClick={() => select(1)} className="min-h-11 text-sm font-medium text-sage-dark underline underline-offset-4">{isHu ? "A számok és a forrásuk" : "Explore the data and sources"}</button>
        <button type="button" onClick={() => select(2)} className="min-h-11 text-sm font-medium text-sage-dark underline underline-offset-4">{isHu ? "A vállalások követése" : "Track your commitments"}</button>
      </div>}
    </div>)}
  </div>;
}
