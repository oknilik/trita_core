import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cta?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-sand bg-cream px-6 py-7 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-2 flex justify-center text-muted">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-ink-body/70">{description}</p>
      ) : null}
      {cta ? (
        <div className="mt-3 flex justify-center">{cta}</div>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
