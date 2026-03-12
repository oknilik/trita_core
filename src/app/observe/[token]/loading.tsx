export default function ObserveLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="animate-pulse rounded-2xl border border-[#e8e4dc] bg-white p-6 md:p-8">
          <div className="h-5 w-24 rounded bg-[#e8e4dc]" />
          <div className="mt-4 h-8 w-64 rounded bg-[#e8e4dc]" />
          <div className="mt-3 h-4 w-full rounded bg-[#f3eee4]" />
          <div className="mt-2 h-4 w-3/4 rounded bg-[#f3eee4]" />
          <div className="mt-8 h-12 w-full rounded-lg bg-[#e8e4dc]" />
        </div>
      </div>
    </div>
  );
}
