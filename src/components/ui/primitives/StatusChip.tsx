import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type StatusChipVariant =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "neutral";

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusChipVariant;
}

const VARIANT_CLASSES: Record<StatusChipVariant, string> = {
  info: "bg-state-info-bg text-state-info-fg",
  success: "bg-state-success-bg text-state-success-fg",
  warning: "bg-state-warning-bg text-state-warning-fg",
  error: "bg-state-error-bg text-state-error-fg",
  neutral: "bg-surface-muted text-text-secondary",
};

export function StatusChip({
  variant = "neutral",
  className,
  children,
  ...props
}: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 whitespace-nowrap items-center rounded-[var(--ui-radius-pill)] px-[var(--ui-space-2_5)] py-[var(--ui-space-1)] text-xs font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
