import { StarLoader } from "@/components/ui/StarLoader";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

// Minimál, márka-hangolt köztes állapot a diszpécser-oldalakhoz
// (UX-audit #4): cream háttér + wordmark + töltő-jel. NEM oldal-alakú
// skeleton — a /dashboard úgyis azonnal átirányít, a „fake dashboard"
// villanás megtévesztő volt.
//
// 2026-08-09: a pörgő karika helyett a formanyelv tinta-csillaga (3. szint).
// Reduced-motion-nál a jel áll, de látszik.
export function RedirectLoader({ locale = "hu" }: { locale?: Locale }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center bg-cream"
    >
      <div className="flex flex-col items-center gap-5">
        <StarLoader size={52} />
        <span className="font-fraunces text-2xl font-black tracking-[-0.03em] text-ink">
          <span className="text-[var(--color-action-primary-bg)]">t</span>rit
          <span className="text-[var(--color-accent-primary)]">a</span>
        </span>
        <span className="sr-only">{t("common.loading", locale)}</span>
      </div>
    </div>
  );
}
