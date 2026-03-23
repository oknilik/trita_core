export default function ProfileLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 bg-cream px-4 py-10">
      <div className="animate-pulse rounded-2xl bg-gradient-to-br from-sage to-sage-deep p-6 pb-14 md:p-8 md:pb-16">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/25" />
          <div>
            <div className="h-7 w-40 rounded bg-white/25" />
            <div className="mt-2 h-4 w-52 rounded bg-white/15" />
          </div>
        </div>
      </div>
      <div className="animate-pulse rounded-2xl border border-sand bg-white p-6">
        <div className="h-5 w-48 rounded bg-sand" />
        <div className="mt-4 h-4 w-72 rounded bg-warm" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-11 rounded-lg bg-warm" />
          <div className="h-11 rounded-lg bg-warm" />
          <div className="h-20 rounded-lg bg-warm" />
          <div className="h-20 rounded-lg bg-warm" />
          <div className="h-11 rounded-lg bg-warm" />
        </div>
      </div>
      <div className="animate-pulse rounded-2xl border border-sand bg-white p-6">
        <div className="h-5 w-32 rounded bg-sand" />
        <div className="mt-4 flex gap-2">
          <div className="h-11 w-24 rounded-lg bg-warm" />
          <div className="h-11 w-24 rounded-lg bg-warm" />
          <div className="h-11 w-24 rounded-lg bg-warm" />
        </div>
      </div>
    </main>
  );
}
