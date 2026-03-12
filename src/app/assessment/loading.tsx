export default function AssessmentLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-8 animate-pulse">
          <div className="h-2 w-full rounded-full bg-[#e8e4dc]" />
        </div>
        <div className="mb-8 animate-pulse rounded-2xl border border-[#e8e4dc] bg-white p-4">
          <div className="h-36 w-full rounded-lg bg-[#f3eee4]" />
        </div>
        <div className="animate-pulse rounded-2xl border border-[#e8e4dc] bg-white p-6">
          <div className="h-5 w-24 rounded bg-[#e8e4dc]" />
          <div className="mt-4 h-6 w-full rounded bg-[#f3eee4]" />
          <div className="mt-6 flex flex-col gap-3">
            <div className="h-12 rounded-lg bg-[#f3eee4]" />
            <div className="h-12 rounded-lg bg-[#f3eee4]" />
            <div className="h-12 rounded-lg bg-[#f3eee4]" />
            <div className="h-12 rounded-lg bg-[#f3eee4]" />
            <div className="h-12 rounded-lg bg-[#f3eee4]" />
          </div>
        </div>
      </div>
    </div>
  );
}
