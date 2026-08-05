import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SectionEyebrowTone = "bronze" | "muted" | "self" | "team" | "org" | "candidate" | "onDark";

// 2026-08-05 (eyebrow-modernizálás): a korábbi „// szekció" mono
// dev-esztétika kivezetve — az egységes eyebrow egy tónus-színű pötty +
// letisztult label (a riport-fejlécekben már élő Trita-idióma). A "mono"
// variáns alias marad a hívás-kompatibilitásért, és ugyanezt az alakot
// rendereli; a tartalom-szintű „// " prefixeket a hívási helyek már nem
// adják át. A pötty `aria-hidden`, a szöveg hordozza a jelentést.
type SectionEyebrowVariant = "mono" | "clean";

const TONE_TEXT: Record<SectionEyebrowTone, string> = {
  bronze: "text-bronze",
  muted: "text-muted",
  self: "text-surface-self-accent",
  team: "text-surface-team-accent",
  org: "text-surface-org-accent",
  candidate: "text-[#e0a878]",
  onDark: "text-white/[0.45]",
};

const TONE_DOT: Record<SectionEyebrowTone, string> = {
  bronze: "bg-bronze",
  muted: "bg-[var(--color-text-muted)]",
  self: "bg-surface-self-accent",
  team: "bg-surface-team-accent",
  org: "bg-surface-org-accent",
  candidate: "bg-[#e0a878]",
  onDark: "bg-white/[0.45]",
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
