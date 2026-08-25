import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type CardVariant = "default" | "elevated" | "muted" | "interactive";
export type CardSpacing = "none" | "sm" | "md" | "lg";
export type CardSurface = "self" | "team" | "org";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  variant?: CardVariant;
  spacing?: CardSpacing;
  surface?: CardSurface;
  accent?: string;
  bordered?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface-card shadow-[var(--ui-shadow-sm)]",
  elevated: "bg-surface-card shadow-[var(--ui-shadow-lg)]",
  muted: "bg-surface-muted",
  interactive:
    "bg-surface-card shadow-[var(--ui-shadow-sm)] transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] hover:border-state-hover-border hover:bg-state-hover-bg hover:text-state-hover-fg hover:shadow-[var(--ui-shadow-md)]",
};

const SPACING_CLASSES: Record<CardSpacing, string> = {
  none: "p-0",
  sm: "p-[var(--ui-space-card-padding-sm)]",
  md: "p-[var(--ui-space-card-padding-md)]",
  lg: "p-[var(--ui-space-card-padding-lg)]",
};

const SURFACE_CLASSES: Record<CardSurface, string> = {
  self: "data-[surface=self]:bg-surface-card data-[surface=self]:border-surface-self-border",
  team: "data-[surface=team]:bg-surface-card data-[surface=team]:border-surface-team-border",
  org: "data-[surface=org]:bg-surface-card data-[surface=org]:border-surface-org-border",
};

const SURFACE_MUTED_CLASSES: Record<CardSurface, string> = {
  self: "data-[surface=self]:bg-surface-self-accent-soft",
  team: "data-[surface=team]:bg-surface-team-accent-soft",
  org: "data-[surface=org]:bg-surface-org-accent-soft",
};

const SURFACE_ACCENT_COLORS: Record<CardSurface, string> = {
  self: "var(--color-surface-self-accent)",
  team: "var(--color-surface-team-accent)",
  org: "var(--color-surface-org-accent)",
};

export function Card({
  as = "div",
  variant = "default",
  spacing = "md",
  surface,
  accent,
  bordered = true,
  className,
  children,
  ...props
}: CardProps) {
  const Component = as;
  const resolvedAccent = accent ?? (surface ? SURFACE_ACCENT_COLORS[surface] : undefined);

  return (
    <Component
      data-surface={surface}
      className={cn(
        "rounded-[var(--ui-radius-2xl)]",
        bordered && "border border-border-default",
        VARIANT_CLASSES[variant],
        SPACING_CLASSES[spacing],
        surface && SURFACE_CLASSES[surface],
        variant === "muted" && surface && SURFACE_MUTED_CLASSES[surface],
        resolvedAccent && "relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {resolvedAccent ? (
        <span
          aria-hidden="true"
          className="absolute left-5 right-5 top-0 h-[3px] rounded-b-full"
          style={{ background: resolvedAccent }}
        />
      ) : null}
      {children}
    </Component>
  );
}
