import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
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
        "rounded-[var(--ui-radius-xl)] border border-border-default bg-surface-muted px-[var(--ui-space-6)] py-[var(--ui-space-7)] text-center",
        "transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-2 flex justify-center text-text-muted">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      ) : null}
      {cta ? (
        <div className="mt-3 flex justify-center">{cta}</div>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
