"use client";

export function SkeletonLoader() {
  return (
    <div className="fixed inset-0 z-50 hidden flex-col bg-white md:flex">
      {/* Navbar skeleton */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="flex gap-3">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-hidden px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Title skeleton */}
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-6 w-1/2 animate-pulse rounded-lg bg-gray-200" />

          {/* Content blocks */}
          <div className="mt-8 space-y-4">
            <div className="h-32 w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
