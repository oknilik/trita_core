export default function AssessmentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-8 animate-pulse">
          <div className="h-2 w-full rounded-full bg-gray-200" />
        </div>
        <div className="mb-8 animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-36 w-full rounded-lg bg-gray-100" />
        </div>
        <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
          <div className="h-5 w-24 rounded bg-gray-200" />
          <div className="mt-4 h-6 w-full rounded bg-gray-100" />
          <div className="mt-6 flex flex-col gap-3">
            <div className="h-12 rounded-lg bg-gray-100" />
            <div className="h-12 rounded-lg bg-gray-100" />
            <div className="h-12 rounded-lg bg-gray-100" />
            <div className="h-12 rounded-lg bg-gray-100" />
            <div className="h-12 rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
