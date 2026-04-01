import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SectionEyebrowTone = "bronze" | "muted" | "self" | "team" | "org";

interface SectionEyebrowProps {
  children: ReactNode;
  as?: ElementType;
  tone?: SectionEyebrowTone;
  className?: string;
}

const TONE_CLASSES: Record<SectionEyebrowTone, string> = {
  bronze: "text-bronze",
  muted: "text-muted",
  self: "text-surface-self-accent",
  team: "text-surface-team-accent",
  org: "text-surface-org-accent",
};

export function SectionEyebrow({
  children,
  as: Component = "p",
  tone = "bronze",
  className,
}: SectionEyebrowProps) {
  return (
    <Component
      className={cn(
        "font-mono text-xs uppercase tracking-widest",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </Component>
  );
}
