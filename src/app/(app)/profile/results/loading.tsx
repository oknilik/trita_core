// UX-B9: a riport-oldal force-dynamic és ~10 párhuzamos lekérdezést vár —
// skeleton nélkül üres képernyő volt a legnehezebb oldal előtt.
export default function ResultsLoading() {
  return (
    <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-10">
        <div className="animate-pulse">
          {/* Hero */}
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6">
            <div className="h-4 w-40 rounded bg-[var(--color-border-default)]" />
            <div className="mt-3 h-8 w-64 rounded bg-[var(--color-border-default)]" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-28 rounded-full bg-[var(--color-border-default)]" />
              <div className="h-8 w-32 rounded-full bg-[var(--color-border-default)]" />
            </div>
          </div>
          {/* Szekciók */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="mt-6 rounded-2xl border border-[var(--color-border-default)] bg-white p-6"
            >
              <div className="h-4 w-48 rounded bg-[var(--color-border-default)]" />
              <div className="mt-4 h-3 w-full rounded bg-[var(--color-border-default)]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[var(--color-border-default)]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[var(--color-border-default)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
