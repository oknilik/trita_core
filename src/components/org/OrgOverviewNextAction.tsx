import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { OrgOverviewFocus } from "@/lib/org-overview-focus";

export function OrgOverviewNextAction({
  focus,
  isHu,
}: {
  focus: OrgOverviewFocus;
  isHu: boolean;
}) {
  return (
    <section
      aria-label={isHu ? "Szervezeti következő lépés" : "Organization next step"}
      className="flex flex-col gap-4 rounded-2xl bg-state-success-bg px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-micro font-semibold uppercase tracking-widest text-state-success-fg">
          {isHu ? "Következő lépés" : "Next step"}
        </p>
        <p className="mt-1 text-caption font-semibold text-ink">{focus.title}</p>
        <p className="mt-1 text-note leading-relaxed text-ink-body">{focus.description}</p>
        {focus.secondary ? (
          <Link
            href={focus.secondary.href}
            className="mt-2 inline-flex items-center text-note font-semibold text-[var(--color-layer-org-bright)] transition hover:text-[var(--color-layer-org-accent)]"
          >
            {focus.secondary.label}
            <ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <Link
        href={focus.primary.href}
        className="inline-flex min-h-10 shrink-0 items-center gap-1 self-start rounded-lg px-2 text-caption font-semibold text-[var(--color-layer-org-bright)] transition hover:bg-surface-card/70 sm:self-auto"
      >
        {focus.primary.label}
        <ChevronRightIcon />
      </Link>
    </section>
  );
}
