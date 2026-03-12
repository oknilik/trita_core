export default function OnboardingLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex animate-pulse flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#f3d4c8]" />
          <div className="h-8 w-52 rounded bg-[#e8e4dc]" />
          <div className="h-4 w-40 rounded bg-[#f3eee4]" />
        </div>
        <div className="mb-8 animate-pulse">
          <div className="mb-2 flex justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-[#e8e4dc]" />
              <div className="hidden h-3 w-10 rounded bg-[#f3eee4] sm:block" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-[#e8e4dc]" />
              <div className="hidden h-3 w-10 rounded bg-[#f3eee4] sm:block" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-[#e8e4dc]" />
              <div className="hidden h-3 w-10 rounded bg-[#f3eee4] sm:block" />
            </div>
          </div>
          <div className="h-1 w-full rounded-full bg-[#e8e4dc]" />
        </div>
        <div className="animate-pulse rounded-2xl border border-[#e8e4dc] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div className="h-4 w-12 rounded bg-[#f3d4c8]" />
            <div className="h-7 w-48 rounded bg-[#e8e4dc]" />
            <div className="h-4 w-64 rounded bg-[#f3eee4]" />
            <div className="h-12 rounded-lg bg-[#f3eee4]" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 rounded-lg bg-[#f3eee4]" />
              <div className="h-11 rounded-lg bg-[#f3eee4]" />
              <div className="h-11 rounded-lg bg-[#f3eee4]" />
              <div className="h-11 rounded-lg bg-[#f3eee4]" />
            </div>
          </div>
          <div className="mt-8 h-12 rounded-lg bg-[#f3d4c8]" />
        </div>
      </div>
    </div>
  );
}
