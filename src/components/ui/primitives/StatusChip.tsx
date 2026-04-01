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
  info: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
  neutral: "bg-sand text-ink-body",
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
        "inline-flex shrink-0 whitespace-nowrap items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
