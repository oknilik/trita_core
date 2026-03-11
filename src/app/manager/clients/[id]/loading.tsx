export default function ClientDetailLoading() {
  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        {/* Back + header */}
        <div>
          <div className="mb-4 h-4 w-36 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-100" />
          <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>

        {/* Personality profile card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex flex-col gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Debrief card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="mb-2 h-5 w-44 animate-pulse rounded bg-gray-100" />
          <div className="mb-4 h-4 w-72 animate-pulse rounded bg-gray-100" />
          <div className="h-11 w-48 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
