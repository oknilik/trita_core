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
    <div className="grid auto-cols-fr grid-flow-col gap-3">
      {cells.map((cell, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-sand bg-white px-5 pb-4 pt-5"
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ backgroundColor: cell.accentColor ?? "#3d6b5e" }}
          />

          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
            {cell.label}
          </p>

          <p className="mt-1.5 font-fraunces text-[28px] leading-none tracking-tight text-ink">
            {cell.value}
          </p>

          {cell.sub && (
            <p className="mt-1.5 text-[11px] leading-snug text-ink-body">
              {cell.sub}
            </p>
          )}

          {cell.insight && (
            <p className="mt-1 text-[10px] italic leading-snug text-muted">
              {cell.insight}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
