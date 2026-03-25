"use client";

export function SkeletonLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f7f4ef]">
      {/* Navbar skeleton */}
      <div className="border-b border-[#e8e0d3] px-5 lg:px-8">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
          <div className="h-5 w-16 animate-pulse rounded bg-[#e8e0d3]" />
          <div className="flex items-center gap-3">
            <div className="hidden h-4 w-14 animate-pulse rounded bg-[#e8e0d3] lg:block" />
            <div className="hidden h-4 w-10 animate-pulse rounded bg-[#e8e0d3] lg:block" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#e8e0d3]" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <div className="h-px w-4 bg-[#e8e0d3]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[#e8e0d3]" />
          </div>
          {/* Headline */}
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[#e8e0d3]" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-[#e8e0d3]" />

          {/* Cards */}
          <div className="mt-8 space-y-4">
            <div className="h-28 w-full animate-pulse rounded-[14px] border border-[#e8e0d3] bg-white" />
            <div className="h-28 w-full animate-pulse rounded-[14px] border border-[#e8e0d3] bg-white" />
          </div>
        </div>
      </div>

      {/* Centered spinner */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3d6b5e] border-t-transparent" />
          <span className="font-fraunces text-sm text-[#8a8a9a]">trit<span className="text-[#c17f4a]">a</span></span>
        </div>
      </div>
    </div>
  );
}
