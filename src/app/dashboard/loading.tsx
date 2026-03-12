export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 bg-[#faf9f6] px-4 py-10">
      <div className="animate-pulse rounded-xl border border-[#e8e4dc] bg-white p-6 md:p-8">
        <div className="h-4 w-32 rounded bg-[#e8e4dc]" />
        <div className="mt-4 h-8 w-48 rounded bg-[#e8e4dc]" />
        <div className="mt-3 h-4 w-40 rounded bg-[#f3eee4]" />
        <div className="mt-6 h-36 w-full rounded-lg bg-[#f3eee4]" />
      </div>
      <div className="animate-pulse rounded-xl border border-[#e8e4dc] bg-white p-6 md:p-8">
        <div className="h-6 w-56 rounded bg-[#e8e4dc]" />
        <div className="mt-4 h-4 w-72 rounded bg-[#f3eee4]" />
        <div className="mx-auto mt-6 h-64 w-64 rounded-full bg-[#f3eee4]" />
      </div>
      <div className="grid animate-pulse gap-4 md:grid-cols-2">
        <div className="h-32 rounded-xl bg-[#f3eee4]" />
        <div className="h-32 rounded-xl bg-[#f3eee4]" />
      </div>
    </main>
  );
}
