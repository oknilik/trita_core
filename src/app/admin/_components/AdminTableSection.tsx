import { AnimatedBar } from "@/components/dashboard/AnimatedBar";

interface AdminTableSectionProps {
  title: string;
  description?: string;
  rows: Array<{
    label: string;
    value: number;
    percentage?: number;
    color?: string;
    subtitle?: string;
  }>;
}

export function AdminTableSection({
  title,
  description,
  rows,
}: AdminTableSectionProps) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="rounded-xl border border-sand bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-ink-body">{description}</p>
          )}
        </div>
        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-ink-body">
          {total}
        </span>
      </div>

      <div className="space-y-4">
        {rows.map((row, idx) => {
          const percentage =
            row.percentage ?? (total > 0 ? (row.value / total) * 100 : 0);
          return (
            <div key={idx}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-ink-body">
                    {row.label}
                  </span>
                  {row.subtitle && (
                    <p className="mt-0.5 text-xs text-ink-body">
                      {row.subtitle}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-ink">
                  {row.value}
                </span>
              </div>
              <div className="mt-2">
                <AnimatedBar
                  value={percentage}
                  color={row.color ?? "#6366F1"}
                  height="h-1.5"
                  delay={idx * 0.1}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
