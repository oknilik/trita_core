export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-[#f7f4ef]">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="animate-pulse">
          <div className="h-3 w-20 rounded bg-[#e8e0d3]" />
          <div className="mt-3 h-7 w-48 rounded bg-[#e8e0d3]" />
          <div className="mt-2 h-4 w-64 rounded bg-[#e8e0d3]" />
          <div className="mt-8 h-40 rounded-xl border border-[#e8e0d3] bg-white" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="h-28 rounded-xl border border-[#e8e0d3] bg-white" />
            <div className="h-28 rounded-xl border border-[#e8e0d3] bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
