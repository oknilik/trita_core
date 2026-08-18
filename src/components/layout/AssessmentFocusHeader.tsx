import type { ReactNode } from "react";
import Link from "next/link";
import { TritaWordmark } from "@/components/TritaLogo";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

interface AssessmentFocusHeaderProps {
  children?: ReactNode;
  center?: ReactNode;
  homeHref?: string;
}

/**
 * A kitöltési folyamatok visszafogott, lebegő fejléce. A publikus fejléc
 * geometriáját követi, de navigáció helyett csak a fókuszhoz szükséges
 * műveleteket tartja meg.
 */
export function AssessmentFocusHeader({
  children,
  center,
  homeHref = "/",
}: AssessmentFocusHeaderProps) {
  return (
    <header
      data-testid="assessment-focus-header"
      className="sticky top-0 z-40 bg-transparent"
    >
      <div className="mx-auto mt-2 grid min-h-14 w-[calc(100%-1.5rem)] max-w-[1180px] grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 rounded-[19px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 px-4 py-2.5 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] lg:mt-3 lg:h-[68px] lg:rounded-[22px] lg:px-5 lg:py-0">
        <Link
          href={homeHref}
          aria-label="trita"
          className={`col-start-1 row-start-1 shrink-0 rounded-md text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
        >
          <TritaWordmark className="text-heading tracking-[-0.04em]" />
        </Link>
        {center ? (
          <div className="col-span-3 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:w-full lg:max-w-[480px] lg:justify-self-center">
            {center}
          </div>
        ) : null}
        {children ? (
          <div className="col-start-3 row-start-1 flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {children}
          </div>
        ) : null}
      </div>
    </header>
  );
}
