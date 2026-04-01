import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type InlineBannerVariant = "info" | "success" | "warning" | "error";

export interface InlineBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: InlineBannerVariant;
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

const VARIANT_STYLES: Record<InlineBannerVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
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
        "rounded-lg border px-4 py-3 text-sm",
        VARIANT_STYLES[variant],
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className={cn(title && "mt-0.5")}>{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
