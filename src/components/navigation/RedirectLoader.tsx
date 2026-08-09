import { StarLoader } from "@/components/ui/StarLoader";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

// Minimál, márka-hangolt köztes állapot a diszpécser-oldalakhoz
// (UX-audit #4): cream háttér + a formanyelv töltő-jele. NEM oldal-alakú
// skeleton — a /dashboard úgyis azonnal átirányít, a „fake dashboard"
// villanás megtévesztő volt.
//
// 2026-08-09: a pörgő karika helyett a tinta-csillag (3. szint), wordmark
// nélkül — a töltés másodperc töredéke, a logó ott csak zaj.
// Reduced-motion-nál a jel áll, de látszik.
export function RedirectLoader({ locale = "hu" }: { locale?: Locale }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center bg-cream"
    >
      <StarLoader size={72} />
      <span className="sr-only">{t("common.loading", locale)}</span>
    </div>
  );
}
