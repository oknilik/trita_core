export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-8 sm:px-8">
        <div className="animate-pulse">
          <div className="rounded-[30px] border border-sand bg-[#2f4863] px-6 py-7 md:px-8 md:py-8">
            <div className="h-2.5 w-28 rounded bg-white/15" />
            <div className="mt-4 h-10 w-60 rounded bg-white/15" />
            <div className="mt-4 h-4 w-full max-w-[520px] rounded bg-white/10" />
            <div className="mt-2 h-4 w-full max-w-[440px] rounded bg-white/10" />
            <div className="mt-6 flex flex-wrap gap-2">
              <div className="h-7 w-28 rounded-full bg-white/12" />
              <div className="h-7 w-24 rounded-full bg-white/12" />
              <div className="h-7 w-36 rounded-full bg-white/12" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="h-[170px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[170px] rounded-[24px] border border-sand bg-white" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="h-[148px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[148px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[148px] rounded-[24px] border border-sand bg-white" />
            <div className="h-[148px] rounded-[24px] border border-sand bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
