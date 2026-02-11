export default function ProfileLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="animate-pulse rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 pb-14 md:p-8 md:pb-16">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/20" />
          <div>
            <div className="h-7 w-40 rounded bg-white/20" />
            <div className="mt-2 h-4 w-52 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="mt-4 h-4 w-72 rounded bg-gray-100" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-11 rounded-lg bg-gray-100" />
          <div className="h-11 rounded-lg bg-gray-100" />
          <div className="h-20 rounded-lg bg-gray-100" />
          <div className="h-20 rounded-lg bg-gray-100" />
          <div className="h-11 rounded-lg bg-gray-100" />
        </div>
      </div>
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="mt-4 flex gap-2">
          <div className="h-11 w-24 rounded-lg bg-gray-100" />
          <div className="h-11 w-24 rounded-lg bg-gray-100" />
          <div className="h-11 w-24 rounded-lg bg-gray-100" />
        </div>
      </div>
    </main>
  );
}
