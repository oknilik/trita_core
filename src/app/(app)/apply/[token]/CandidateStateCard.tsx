import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Jelölt-flow állapotkártya (2026-08-05 vizuális frissítés): a kész/
// lejárt/visszavont/köszönő képernyők közös, terrakotta-akcentes
// kártyája. Szerver- és kliens-oldalról is használható (nincs hook).
// ─────────────────────────────────────────────────────────────────────

export function CandidateStateCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: ReactNode;
  body: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-4 py-16">
        <div className="relative w-full overflow-hidden rounded-[24px] border border-sand bg-white px-6 py-9 text-center shadow-[0_16px_40px_rgba(26,26,46,0.05)] md:px-10">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-candidate via-accent-candidate-mid to-accent-candidate-primary"
          />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-candidate-soft text-[26px] leading-none">
            <span aria-hidden>{icon}</span>
          </div>
          <h1 className="mt-5 font-fraunces text-title tracking-tight text-ink">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-[430px] text-body leading-relaxed text-ink-body">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
