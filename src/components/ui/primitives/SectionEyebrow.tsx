import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SectionEyebrowTone =
  | "bronze"
  | "muted"
  | "self"
  | "selfDeep"
  | "team"
  | "org"
  | "candidate"
  | "candidateOnDark"
  | "onDark";

// 2026-08-05 (eyebrow-modernizálás): a korábbi „// szekció" mono
// dev-esztétika kivezetve — az egységes eyebrow egy tónus-színű pötty +
// letisztult label (a riport-fejlécekben már élő trita-idióma). A "mono"
// variáns alias marad a hívás-kompatibilitásért, és ugyanezt az alakot
// rendereli; a tartalom-szintű „// " prefixeket a hívási helyek már nem
// adják át. A pötty `aria-hidden`, a szöveg hordozza a jelentést.
type SectionEyebrowVariant = "mono" | "clean";

// A bronz tónus a MÉLYEBB bronzot (accent-primary-strong = bronze-700)
// használja, nem a brand-bronzot: az eyebrow 11 px-es nagybetűs szöveg, ott
// 4,5:1 a küszöb, a brand-bronz viszont krémen csak 2,99:1-et ad (UX-audit
// 2026-08-07). A mélyebb árnyalat 5,7:1 — a hue és a karakter marad.
// Sötét sémán a bronze-700 világos árnyalat, tehát ott is helyes.
const TONE_TEXT: Record<SectionEyebrowTone, string> = {
  bronze: "text-[var(--color-accent-primary-strong)]",
  muted: "text-muted",
  self: "text-surface-self-accent",
  // A self-réteg MÉLY zsályája: 11px-es nagybetűs felirathoz a sima sage
  // kontrasztja krémen kevés — az auth-oldalak eyebrow-ja ezt használja.
  selfDeep: "text-[var(--color-accent-self-deep)]",
  team: "text-surface-team-accent",
  org: "text-surface-org-accent",
  candidate: "text-accent-candidate",
  candidateOnDark: "text-accent-candidate-primary",
  onDark: "text-[var(--color-text-on-inverse-muted)]",
};

const TONE_DOT: Record<SectionEyebrowTone, string> = {
  bronze: "bg-[var(--color-accent-primary-strong)]",
  muted: "bg-[var(--color-text-muted)]",
  self: "bg-surface-self-accent",
  selfDeep: "bg-[var(--color-accent-self-deep)]",
  team: "bg-surface-team-accent",
  org: "bg-surface-org-accent",
  candidate: "bg-accent-candidate",
  candidateOnDark: "bg-accent-candidate-primary",
  onDark: "bg-[var(--color-text-on-inverse-muted)]",
};

interface SectionEyebrowProps {
  children: ReactNode;
  as?: ElementType;
  tone?: SectionEyebrowTone;
  variant?: SectionEyebrowVariant;
  /** A pötty elhagyása sűrű felsorolásokban, ahol vizuális zaj lenne. */
  dot?: boolean;
  className?: string;
}

export function SectionEyebrow({
  children,
  as: Component = "p",
  tone = "bronze",
  variant = "clean",
  dot = true,
  className,
}: SectionEyebrowProps) {
  void variant; // alias — minden variáns az egységes alakot rendereli
  return (
    <Component
      className={cn(
        "inline-flex items-center gap-2 text-label uppercase",
        TONE_TEXT[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        />
      )}
      {children}
    </Component>
  );
}
