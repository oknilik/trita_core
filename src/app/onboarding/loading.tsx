export default function OnboardingLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex animate-pulse flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#f3d4c8]" />
          <div className="h-7 w-48 rounded bg-[#e8e4dc]" />
          <div className="h-4 w-64 rounded bg-[#f3eee4]" />
        </div>
        <div className="animate-pulse rounded-2xl border border-[#e8e4dc] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div className="h-11 rounded-lg bg-[#f3eee4]" />
            <div className="h-11 rounded-lg bg-[#f3eee4]" />
            <div className="h-24 rounded-lg bg-[#f3eee4]" />
            <div className="h-24 rounded-lg bg-[#f3eee4]" />
            <div className="h-11 rounded-lg bg-[#f3eee4]" />
          </div>
          <div className="mt-8 h-12 rounded-lg bg-[#f3d4c8]" />
        </div>
      </div>
    </div>
  );
}
