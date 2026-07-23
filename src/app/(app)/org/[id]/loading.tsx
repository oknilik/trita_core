import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

export default function OrgLoading() {
  return (
    <PlatformPageShell
      surface="org"
      contentClassName="max-w-5xl gap-10 px-4 py-10 md:gap-14"
    >
        <section className="relative overflow-hidden rounded-2xl bg-[#22374d] animate-pulse">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.05]" />
          <div className="px-7 py-7 md:px-9 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div>
                <div className="h-2.5 w-28 rounded bg-white/20" />
                <div className="mt-4 h-10 w-56 rounded bg-white/20" />
                <div className="mt-3 h-4 w-full max-w-[520px] rounded bg-white/15" />
                <div className="mt-2 h-4 w-full max-w-[440px] rounded bg-white/15" />
                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="h-7 w-24 rounded-full bg-white/15" />
                  <div className="h-7 w-24 rounded-full bg-white/15" />
                  <div className="h-7 w-32 rounded-full bg-white/15" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="h-11 w-40 rounded-[9px] bg-[#d2a36a]/80" />
                  <div className="h-11 w-36 rounded-[9px] bg-white/15" />
                  <div className="h-11 w-32 rounded-[9px] bg-white/15" />
                </div>
              </div>

              <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-4 lg:block">
                <div className="h-2.5 w-24 rounded bg-white/20" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-xl bg-white/15" />
                  <div className="h-16 rounded-xl bg-white/15" />
                  <div className="h-16 rounded-xl bg-white/15" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="h-7 rounded bg-white/15" />
                  <div className="h-7 rounded bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-pulse">
          <div className="mb-5 h-3 w-36 rounded bg-sand/70" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-[126px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[126px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[126px] rounded-[24px] border border-sand bg-white" />
          </div>
        </section>

        <section className="animate-pulse">
          <div className="mb-5 h-3 w-28 rounded bg-sand/70" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-[146px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[146px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[146px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[146px] rounded-[24px] border border-sand bg-white" />
          </div>
        </section>

        <section className="animate-pulse">
          <div className="mb-5 h-3 w-32 rounded bg-sand/70" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-[92px] rounded-2xl border border-sand bg-white" />
            <div className="h-[92px] rounded-2xl border border-sand bg-white" />
          </div>
        </section>

        <section className="rounded-[28px] bg-[var(--color-accent-self-deep)] p-8 md:p-12 animate-pulse">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="h-8 w-64 rounded bg-white/20" />
              <div className="mt-3 h-4 w-full max-w-[420px] rounded bg-white/15" />
            </div>
            <div className="flex gap-2">
              <div className="h-11 w-36 rounded-[10px] bg-[var(--color-accent-primary)]/80" />
              <div className="h-11 w-36 rounded-[10px] bg-white/15" />
            </div>
          </div>
        </section>

        <section className="animate-pulse">
          <div className="h-10 w-full rounded-lg bg-sand/50" />
          <div className="mt-4 h-[320px] w-full rounded-2xl bg-sand/30" />
        </section>
    </PlatformPageShell>
  );
}
