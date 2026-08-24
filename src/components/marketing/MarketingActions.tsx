import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

interface MarketingAction {
  href: string;
  label: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  iconRight?: ReactNode;
}

export function MarketingActions({
  primary,
  secondary,
  align = "start",
  className = "",
}: {
  primary: MarketingAction;
  secondary?: MarketingAction;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={[
        "flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center",
        align === "center" ? "sm:justify-center" : "sm:justify-start",
        className,
      ].join(" ")}
    >
      <Link
        href={primary.href}
        onClick={primary.onClick}
        className={getButtonClassName({
          size: "lg",
          className: "min-h-[52px] px-7 text-base",
        })}
      >
        {primary.label}
      </Link>
      {secondary ? (
        <Link
          href={secondary.href}
          onClick={secondary.onClick}
          className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-action-primary-bg)] ${FOCUS_RING_CLASS}`}
        >
          {secondary.label}
          {secondary.iconRight}
        </Link>
      ) : null}
    </div>
  );
}
