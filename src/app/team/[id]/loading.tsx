export default function TeamLoading() {
  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto w-full max-w-5xl px-4 py-10 animate-pulse">
        <div className="flex gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 flex-1 rounded-xl bg-[#e8e4dc]/50" />
          ))}
        </div>
        <div className="h-8 w-48 rounded bg-[#e8e4dc]/50 mb-4" />
        <div className="h-5 w-72 rounded bg-[#e8e4dc]/30 mb-8" />
        <div className="h-96 rounded-2xl bg-[#e8e4dc]/30" />
      </main>
    </div>
  );
}
