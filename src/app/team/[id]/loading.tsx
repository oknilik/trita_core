export default function TeamLoading() {
  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-5xl px-4 py-10 animate-pulse">
        <div className="flex gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 flex-1 rounded-xl bg-sand/50" />
          ))}
        </div>
        <div className="h-8 w-48 rounded bg-sand/50 mb-4" />
        <div className="h-5 w-72 rounded bg-sand/30 mb-8" />
        <div className="h-96 rounded-2xl bg-sand/30" />
      </main>
    </div>
  );
}
