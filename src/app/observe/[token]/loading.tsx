export default function ObserveLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="animate-pulse rounded-2xl border border-sand bg-white p-6 md:p-8">
          <div className="h-5 w-24 rounded bg-sand" />
          <div className="mt-4 h-8 w-64 rounded bg-sand" />
          <div className="mt-3 h-4 w-full rounded bg-warm" />
          <div className="mt-2 h-4 w-3/4 rounded bg-warm" />
          <div className="mt-8 h-12 w-full rounded-lg bg-sand" />
        </div>
      </div>
    </div>
  );
}
