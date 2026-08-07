"use client";

export function SkeletonLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-surface-canvas)]">
      {/* Navbar skeleton */}
      <div className="border-b border-[var(--color-border-default)] px-5 lg:px-8">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
          <div className="h-5 w-16 animate-pulse rounded bg-[var(--color-border-default)]" />
          <div className="flex items-center gap-3">
            <div className="hidden h-4 w-14 animate-pulse rounded bg-[var(--color-border-default)] lg:block" />
            <div className="hidden h-4 w-10 animate-pulse rounded bg-[var(--color-border-default)] lg:block" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-border-default)]" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <div className="h-px w-4 bg-[var(--color-border-default)]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-border-default)]" />
          </div>
          {/* Headline */}
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[var(--color-border-default)]" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-[var(--color-border-default)]" />

          {/* Cards */}
          <div className="mt-8 space-y-4">
            <div className="h-28 w-full animate-pulse rounded-xl border border-[var(--color-border-default)] bg-surface-card" />
            <div className="h-28 w-full animate-pulse rounded-xl border border-[var(--color-border-default)] bg-surface-card" />
          </div>
        </div>
      </div>

      {/* Centered spinner */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-action-primary-bg)] border-t-transparent" />
          <span className="font-fraunces text-sm text-[var(--color-text-muted)]">trit<span className="text-[var(--color-accent-primary)]">a</span></span>
        </div>
      </div>
    </div>
  );
}
