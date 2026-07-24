"use client";

// A külső visszajelzés állapot-kártyája szervezeti tagoknak (self/csapat
// szétválasztás, 2026-07-22). Állapot-nyelvet beszél, nem hiány-nyelvet:
// a kampány-vezérelt observer nem a felhasználó személyes mulasztása.

export interface ObserverFlowCardData {
  state: "locked" | "in_progress" | "available";
  receivedCount: number;
  minForReveal: number;
  activeCampaignName: string | null;
}

export function ObserverFlowStatusCard({
  flow,
  isHu,
  onOpenComparison,
}: {
  flow: ObserverFlowCardData;
  isHu: boolean;
  /** „Elérhető" állapotban az összevetés-tab megnyitása. */
  onOpenComparison?: () => void;
}) {
  if (flow.state === "available") {
    return (
      <section className="rounded-2xl border border-sage-ring bg-sage-ghost p-6 md:p-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage text-white">
            <svg viewBox="0 0 16 16" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5l3 3 7-7" />
            </svg>
          </span>
          <div>
            <h2 className="font-fraunces text-xl text-ink">
              {isHu ? "Megérkezett a külső visszajelzésed" : "Your outside feedback has arrived"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
              {isHu
                ? `${flow.receivedCount} kollégád adott visszajelzést a csapat-folyamatban — az önképed és a külső kép összevetése elérhető.`
                : `${flow.receivedCount} colleagues gave feedback in the team process — your self-image vs. outside view comparison is available.`}
            </p>
            {onOpenComparison ? (
              <button
                type="button"
                onClick={onOpenComparison}
                className="mt-3 inline-flex min-h-[42px] items-center rounded-[10px] bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark"
              >
                {isHu ? "Összevetés megnyitása →" : "Open comparison →"}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (flow.state === "in_progress") {
    const pct = Math.min(
      100,
      Math.round((flow.receivedCount / Math.max(1, flow.minForReveal)) * 100),
    );
    return (
      <section className="rounded-2xl border border-sand bg-white p-6 md:p-8">
        <p className="font-mono text-micro uppercase tracking-widest text-bronze">
          {isHu ? "// csapat-folyamat" : "// team process"}
        </p>
        <h2 className="mt-1 font-fraunces text-xl text-ink">
          {isHu ? "Külső visszajelzés — folyamatban" : "Outside feedback — in progress"}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
          {flow.activeCampaignName
            ? isHu
              ? `A(z) „${flow.activeCampaignName}" kampányban kollégáid most adnak rólad visszajelzést.`
              : `In the "${flow.activeCampaignName}" campaign your colleagues are giving feedback about you.`
            : isHu
              ? "A szervezeted kampányában kollégáid most adnak rólad visszajelzést."
              : "Your colleagues are giving feedback about you in your organization's campaign."}
        </p>
        {/* Gyűjtő-narratíva (F3): kis küszöbnél nem absztrakt sáv, hanem
            látható helyek — a hiányzó slot maga a CTA. Nagy küszöbnél
            (8+) marad az arányos sáv. */}
        {flow.minForReveal <= 8 ? (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex gap-2.5" role="img" aria-label={`${flow.receivedCount}/${flow.minForReveal}`}>
              {Array.from({ length: flow.minForReveal }, (_, i) => {
                const filled = i < flow.receivedCount;
                return (
                  <span
                    key={i}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-base transition-colors ${
                      filled
                        ? "border-2 border-sage bg-sage-soft font-bold text-sage"
                        : "border-2 border-dashed border-sand text-muted"
                    }`}
                  >
                    {filled ? (
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5l3 3 7-7" />
                      </svg>
                    ) : (
                      "·"
                    )}
                  </span>
                );
              })}
            </div>
            <span className="font-mono text-xs text-ink">
              {flow.receivedCount}/{flow.minForReveal}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-sage transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-xs text-ink">
              {flow.receivedCount}/{flow.minForReveal}
            </span>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          {isHu
            ? `Az összevetés ${flow.minForReveal} beérkezett visszajelzésnél nyílik meg — így egyik kollégád válasza sem visszakereshető.`
            : `The comparison opens at ${flow.minForReveal} received responses — so no single colleague's answer can be traced back.`}
        </p>
      </section>
    );
  }

  // locked — még nincs kampány
  return (
    <section className="rounded-2xl border border-sand bg-cream/60 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-muted ring-1 ring-sand">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
          </svg>
        </span>
        <div>
          <h2 className="font-fraunces text-xl text-ink">
            {isHu ? "A külső visszajelzés a csapat-folyamat része" : "Outside feedback is part of the team process"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
            {isHu
              ? "Szervezeti tagként nem kell külön meghívnod senkit: a kollégai visszajelzést a szervezeted következő mérési kampánya gyűjti be. Amikor elindul, itt követheted a beérkezést, és a küszöb elérésekor itt nyílik meg az önkép–külső kép összevetésed."
              : "As an organization member you don't need to invite anyone yourself: colleague feedback is collected by your organization's next measurement campaign. Once it starts, you can follow it here, and your self-image vs. outside view comparison opens here when the threshold is reached."}
          </p>
          <p className="mt-2 text-xs text-muted">
            {isHu
              ? "A saját eredményed ettől függetlenül teljes — a kitöltéssel a személyes utad kerek."
              : "Your own result is complete regardless — finishing the assessment completes your personal journey."}
          </p>
        </div>
      </div>
    </section>
  );
}

// Kompakt állapot-csík az eredményoldal tetejére (a self-serve ProgressBar
// helyett org-tagoknál): a saját út kész, az observer csapat-folyamat.
export function ObserverFlowStrip({
  flow,
  isHu,
  onOpenInvites,
  onOpenComparison,
}: {
  flow: ObserverFlowCardData;
  isHu: boolean;
  onOpenInvites?: () => void;
  onOpenComparison?: () => void;
}) {
  const observerPart =
    flow.state === "available" ? (
      <button
        type="button"
        onClick={onOpenComparison}
        className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sage-dark"
      >
        {isHu
          ? `Külső visszajelzés megérkezett (${flow.receivedCount}) — összevetés →`
          : `Outside feedback arrived (${flow.receivedCount}) — comparison →`}
      </button>
    ) : flow.state === "in_progress" ? (
      <button
        type="button"
        onClick={onOpenInvites}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        {isHu
          ? `Külső visszajelzés folyamatban (${flow.receivedCount}/${flow.minForReveal})`
          : `Outside feedback in progress (${flow.receivedCount}/${flow.minForReveal})`}
      </button>
    ) : (
      <button
        type="button"
        onClick={onOpenInvites}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-body ring-1 ring-sand transition hover:bg-cream"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </svg>
        {isHu
          ? "Külső visszajelzés: a csapat-folyamatban nyílik meg"
          : "Outside feedback: opens in the team process"}
      </button>
    );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sand bg-white px-4 py-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-ghost px-3 py-1.5 text-xs font-semibold text-sage-dark">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5l3 3 7-7" />
        </svg>
        {isHu ? "Saját eredményed kész" : "Your own result is complete"}
      </span>
      <span className="text-sand">·</span>
      {observerPart}
    </div>
  );
}
