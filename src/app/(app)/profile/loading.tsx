export default function ProfileLoading() {
  return (
    <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <div className="mx-auto max-w-[640px] px-5 pt-10 pb-20">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 pb-7">
            <div className="h-14 w-14 rounded-full bg-[var(--color-border-default)]" />
            <div>
              <div className="h-5 w-32 rounded bg-[var(--color-border-default)]" />
              <div className="mt-2 h-3 w-44 rounded bg-[var(--color-border-default)]" />
            </div>
          </div>
          <div className="border-t border-[var(--color-border-default)] py-6">
            <div className="h-4 w-16 rounded bg-[var(--color-border-default)]" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-11 rounded-lg border border-[var(--color-border-default)] bg-surface-card" />
              <div className="h-11 rounded-lg border border-[var(--color-border-default)] bg-surface-card" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-20 rounded-full bg-[var(--color-border-default)]" />
              <div className="h-10 w-16 rounded-full bg-[var(--color-border-default)]" />
              <div className="h-10 w-20 rounded-full bg-[var(--color-border-default)]" />
            </div>
          </div>
          <div className="border-t border-[var(--color-border-default)] py-6">
            <div className="h-4 w-32 rounded bg-[var(--color-border-default)]" />
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-24 rounded-full bg-[var(--color-border-default)]" />
              <div className="h-10 w-24 rounded-full bg-[var(--color-border-default)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
