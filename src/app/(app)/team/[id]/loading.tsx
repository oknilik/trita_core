import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

export default function TeamLoading() {
  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
        <div className="animate-pulse">
          <div className="h-3 w-44 rounded bg-sand/70" />
        </div>

        <section className="relative overflow-hidden rounded-[28px] bg-[#4a314a] animate-pulse">
          <div className="pointer-events-none absolute -right-16 -top-16 h-[240px] w-[240px] rounded-full bg-white/[0.05]" />
          <div className="px-6 pb-7 pt-7 md:px-8 md:pb-8 md:pt-9">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div>
                <div className="h-2.5 w-24 rounded bg-white/20" />
                <div className="mt-4 h-10 w-56 rounded bg-white/20" />
                <div className="mt-4 h-4 w-full max-w-[520px] rounded bg-white/15" />
                <div className="mt-2 h-4 w-full max-w-[440px] rounded bg-white/15" />
                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="h-7 w-24 rounded-full bg-white/15" />
                  <div className="h-7 w-28 rounded-full bg-white/15" />
                  <div className="h-7 w-36 rounded-full bg-white/15" />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="h-11 w-44 rounded-[10px] bg-[#d48e62]/80" />
                  <div className="h-11 w-40 rounded-[10px] bg-white/15" />
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
          <div className="mb-4 h-3 w-28 rounded bg-sand/70" />
          <div className="mb-3 h-3 w-24 rounded bg-sand/60" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-[170px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[170px] rounded-[24px] border border-sand bg-white" />
          </div>
        </section>

        <section className="animate-pulse">
          <div className="mb-4 h-3 w-24 rounded bg-sand/70" />
          <div className="mb-2 h-3 w-20 rounded bg-sand/60" />
          <div className="overflow-hidden rounded-[24px] border border-sand bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid rgba(232, 224, 211, 0.8)",
                }}
              >
                <div className="h-8 w-8 rounded-full bg-sand/60" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-40 rounded bg-sand/70" />
                  <div className="mt-1.5 h-2.5 w-24 rounded bg-sand/50" />
                </div>
                <div className="h-5 w-14 rounded-full bg-sand/60" />
                <div className="h-3 w-8 rounded bg-sand/60" />
              </div>
            ))}
          </div>
        </section>

        <section className="animate-pulse">
          <div className="mb-4 h-3 w-32 rounded bg-sand/70" />
          <div className="h-[168px] rounded-[24px] border border-sand bg-white" />
        </section>
    </PlatformPageShell>
  );
}
