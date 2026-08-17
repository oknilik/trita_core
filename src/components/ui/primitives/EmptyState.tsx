import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cta?: ReactNode;
  variant?: "compact" | "action";
}

export function EmptyState({
  icon,
  title,
  description,
  cta,
  variant = "compact",
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--ui-radius-xl)] border border-border-default bg-surface-card px-[var(--ui-space-6)] py-[var(--ui-space-7)]",
        "transition duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
        variant === "compact" ? "text-center" : "text-left",
        className,
      )}
      {...props}
    >
      <div className={cn(variant === "action" && "grid grid-cols-[44px_minmax(0,1fr)] gap-3")}>
        {icon ? (
          <div className={cn(
            "flex text-text-muted",
            variant === "compact"
              ? "mb-2 justify-center"
              : "size-11 items-center justify-center rounded-[14px] bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]",
          )}>
            {icon}
          </div>
        ) : variant === "action" ? <span aria-hidden /> : null}
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p>
          ) : null}
        </div>
      </div>
      {cta ? (
        <div className={cn("mt-4 flex", variant === "compact" ? "justify-center" : "pl-14")}>{cta}</div>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
