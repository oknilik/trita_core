import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SectionEyebrowTone = "bronze" | "muted" | "self" | "team" | "org";

// Két hangfekvés (2026-07-22 UI-egységesítés, F1):
//  · "mono"  — a megszokott dev-esztétika („// szekció") admin/belső
//              felületekre; a „// " prefix tartalom-szinten marad (a meglévő
//              használati helyek vegyesen adják, auto-prefix duplázna).
//  · "clean" — letisztult label-stílus (text-label token: 11px · 600 ·
//              +0.14em) az ügyfél-felületekre.
// Alapértelmezés a "mono" — a meglévő használati helyek viselkedése
// változatlan.
type SectionEyebrowVariant = "mono" | "clean";

interface SectionEyebrowProps {
  children: ReactNode;
  as?: ElementType;
  tone?: SectionEyebrowTone;
  variant?: SectionEyebrowVariant;
  className?: string;
}

const TONE_CLASSES: Record<SectionEyebrowTone, string> = {
  bronze: "text-bronze",
  muted: "text-muted",
  self: "text-surface-self-accent",
  team: "text-surface-team-accent",
  org: "text-surface-org-accent",
};

const VARIANT_CLASSES: Record<SectionEyebrowVariant, string> = {
  mono: "font-mono text-xs uppercase tracking-widest",
  clean: "text-label uppercase",
};

export function SectionEyebrow({
  children,
  as: Component = "p",
  tone = "bronze",
  variant = "mono",
  className,
}: SectionEyebrowProps) {
  return (
    <Component
      className={cn(
        VARIANT_CLASSES[variant],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </Component>
  );
}
