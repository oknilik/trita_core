// UX-B9: az interakció-oldal force-dynamic (meghívó-lekérdezés + 30
// archetípus-szimuláció) — skeleton az üres képernyő helyett.
export default function InteractionLoading() {
  return (
    <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-10">
        <div className="animate-pulse">
          <div className="h-8 w-72 rounded bg-[var(--color-border-default)]" />
          <div className="mt-3 h-3 w-96 max-w-full rounded bg-[var(--color-border-default)]" />
          <div className="mt-8 rounded-2xl border border-[var(--color-border-default)] bg-white p-6">
            <div className="h-4 w-56 rounded bg-[var(--color-border-default)]" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
