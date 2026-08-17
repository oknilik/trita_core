import type { ReactNode } from "react";
import Link from "next/link";
import { TritaWordmark } from "@/components/TritaLogo";

interface AssessmentFocusHeaderProps {
  children?: ReactNode;
  homeHref?: string;
}

/**
 * A kitöltési folyamatok visszafogott, lebegő fejléce. A publikus fejléc
 * geometriáját követi, de navigáció helyett csak a fókuszhoz szükséges
 * műveleteket tartja meg.
 */
export function AssessmentFocusHeader({
  children,
  homeHref = "/",
}: AssessmentFocusHeaderProps) {
  return (
    <header
      data-testid="assessment-focus-header"
      className="sticky top-0 z-40 bg-transparent"
    >
      <div className="mx-auto mt-2 flex h-14 w-[calc(100%-1.5rem)] max-w-[1180px] items-center justify-between gap-3 rounded-[19px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 px-4 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] lg:mt-3 lg:h-[68px] lg:rounded-[22px] lg:px-5">
        <Link
          href={homeHref}
          aria-label="trita"
          className="shrink-0 text-[var(--color-text-primary)]"
        >
          <TritaWordmark className="text-[22px] tracking-[-0.04em]" />
        </Link>
        {children ? (
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {children}
          </div>
        ) : null}
      </div>
    </header>
  );
}
