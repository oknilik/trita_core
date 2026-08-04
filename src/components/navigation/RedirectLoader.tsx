// Minimál, márka-hangolt köztes állapot a diszpécser-oldalakhoz
// (UX-audit #4): cream háttér + wordmark + kis spinner. NEM oldal-alakú
// skeleton — a /dashboard úgyis azonnal átirányít, a „fake dashboard"
// villanás megtévesztő volt. Reduced-motion-nál a spinner nem pörög.
export function RedirectLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <span className="font-fraunces text-2xl font-black tracking-[-0.03em] text-ink">
          <span className="text-[var(--color-action-primary-bg)]">t</span>rit
          <span className="text-[var(--color-accent-primary)]">a</span>
        </span>
        <span
          aria-hidden
          className="h-5 w-5 rounded-full border-2 border-sand border-t-[var(--color-accent-primary)] motion-safe:animate-spin"
        />
      </div>
    </div>
  );
}
