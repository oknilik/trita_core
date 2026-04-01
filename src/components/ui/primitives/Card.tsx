import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type CardVariant = "default" | "elevated" | "muted" | "interactive";
export type CardSpacing = "sm" | "md" | "lg";
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
  default: "bg-white shadow-sm",
  elevated: "bg-white shadow-[0_16px_40px_rgba(26,26,46,0.08)]",
  muted: "bg-cream",
  interactive: "bg-white shadow-sm transition hover:border-sage/40 hover:shadow-md",
};

const SPACING_CLASSES: Record<CardSpacing, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const SURFACE_CLASSES: Record<CardSurface, string> = {
  self: "data-[surface=self]:bg-white",
  team: "data-[surface=team]:bg-white",
  org: "data-[surface=org]:bg-white",
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

  return (
    <Component
      data-surface={surface}
      className={cn(
        "rounded-2xl",
        bordered && "border border-sand",
        VARIANT_CLASSES[variant],
        SPACING_CLASSES[spacing],
        surface && SURFACE_CLASSES[surface],
        accent && "relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {accent ? (
        <span
          aria-hidden="true"
          className="absolute left-5 right-5 top-0 h-[3px] rounded-b-full"
          style={{ background: accent }}
        />
      ) : null}
      {children}
    </Component>
  );
}
