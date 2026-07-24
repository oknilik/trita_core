export interface StatCell {
  label: string;
  value: string | number;
  sub?: string;
  insight?: string;
  accentColor?: string;
}

interface StatStripProps {
  cells: StatCell[];
}

export function StatStrip({ cells }: StatStripProps) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
      {cells.map((cell, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-[22px] border border-sand bg-white px-5 py-5 shadow-[0_12px_30px_rgba(26,26,46,0.04)]"
        >
          <div
            className="absolute left-5 right-5 top-0 h-[3px] rounded-b-full"
            style={{ backgroundColor: cell.accentColor ?? "var(--color-action-primary-bg)" }}
          />

          <p className="font-dm-sans text-micro font-semibold uppercase tracking-[0.18em] text-muted">
            {cell.label}
          </p>

          <p className="mt-2 font-fraunces text-[30px] leading-none tracking-tight text-ink">
            {cell.value}
          </p>

          {cell.sub && (
            <p className="mt-2 text-[11px] leading-[1.45] text-ink-body">
              {cell.sub}
            </p>
          )}

          {cell.insight && (
            <p className="mt-2 text-[11px] italic leading-[1.5] text-muted">
              {cell.insight}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
