import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type InlineBannerVariant = "info" | "success" | "warning" | "error";

export interface InlineBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: InlineBannerVariant;
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

const VARIANT_STYLES: Record<InlineBannerVariant, string> = {
  info: "border-state-info-border bg-state-info-bg text-state-info-fg",
  success: "border-state-success-border bg-state-success-bg text-state-success-fg",
  warning: "border-state-warning-border bg-state-warning-bg text-state-warning-fg",
  error: "border-state-error-border bg-state-error-bg text-state-error-fg",
};

export function InlineBanner({
  variant = "info",
  title,
  icon,
  action,
  className,
  children,
  ...props
}: InlineBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--ui-radius-lg)] border px-[var(--ui-space-4)] py-[var(--ui-space-3)] text-sm",
        "transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
        VARIANT_STYLES[variant],
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className={cn(title ? "mt-0.5" : undefined)}>{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
