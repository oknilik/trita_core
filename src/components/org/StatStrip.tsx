export interface StatCell {
  label: string;
  value: string | number;
  sub?: string;
  accentColor?: string;
}

interface StatStripProps {
  cells: StatCell[];
}

export function StatStrip({ cells }: StatStripProps) {
  return (
    <div className="flex items-stretch divide-x divide-[#e8e4dc] overflow-x-auto overflow-y-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {cells.map((cell, i) => (
        <div
          key={i}
          className="relative flex min-w-[140px] flex-shrink-0 flex-1 flex-col gap-1 px-5 py-4"
        >
          {/* Top accent bar */}
          <div
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{ backgroundColor: cell.accentColor ?? "#c8410a" }}
          />
          {/* Label */}
          <p
            style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#a09a90",
              lineHeight: 1.4,
            }}
          >
            {cell.label}
          </p>
          {/* Value */}
          <p
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "22px",
              color: "#1a1814",
              lineHeight: 1.2,
              fontWeight: 400,
            }}
          >
            {cell.value}
          </p>
          {/* Sub */}
          {cell.sub && (
            <p
              style={{
                fontSize: "10px",
                color: "#5a5650",
                lineHeight: 1.4,
              }}
            >
              {cell.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
