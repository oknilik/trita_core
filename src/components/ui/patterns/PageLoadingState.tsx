import { PlatformPageShell, type PlatformSurface } from "@/components/layout/PlatformPageShell";

export function PageLoadingState({ surface = "self" }: { surface?: PlatformSurface }) {
  return (
    <PlatformPageShell
      surface={surface}
      contentClassName="max-w-5xl gap-4 px-4 py-10"
    >
      <section
        aria-busy="true"
        aria-label="Loading"
        className="rounded-[20px] border border-border-default bg-surface-card p-5 motion-safe:animate-pulse md:p-7"
      >
        <span className="sr-only">Loading</span>
        <div className="h-5 w-44 rounded-full bg-[var(--color-border-default)]" />
        <div className="mt-4 h-3 w-full max-w-2xl rounded-full bg-[var(--color-surface-subtle)]" />
        <div className="mt-2 h-3 w-2/3 rounded-full bg-[var(--color-surface-subtle)]" />
      </section>
      <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
        <div className="h-36 rounded-[20px] border border-border-default bg-surface-card motion-safe:animate-pulse" />
        <div className="h-36 rounded-[20px] border border-border-default bg-surface-card motion-safe:animate-pulse" />
      </div>
    </PlatformPageShell>
  );
}
