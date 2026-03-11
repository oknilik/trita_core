export default function OutputLoading() {
  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
        {/* Back + header */}
        <div>
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-56 animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-2 flex items-center gap-3">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        {/* Section cards */}
        <div className="flex flex-col gap-4">
          {[140, 200, 180, 160, 120].map((height, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-5"
              style={{ minHeight: height }}
            />
          ))}
        </div>

        {/* Action button */}
        <div className="h-11 w-32 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}
