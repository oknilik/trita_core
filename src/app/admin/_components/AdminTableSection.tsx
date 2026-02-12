import { AnimatedBar } from "@/components/dashboard/AnimatedBar";

interface AdminTableSectionProps {
  title: string;
  description?: string;
  rows: Array<{
    label: string;
    value: number;
    percentage?: number;
    color?: string;
  }>;
}

export function AdminTableSection({
  title,
  description,
  rows,
}: AdminTableSectionProps) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6 md:p-8">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      )}

      <div className="mt-6 space-y-4">
        {rows.map((row, idx) => {
          const percentage =
            row.percentage ?? (total > 0 ? (row.value / total) * 100 : 0);
          return (
            <div key={idx}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {row.label}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {row.value}
                </span>
              </div>
              <div className="mt-2">
                <AnimatedBar
                  value={percentage}
                  color={row.color ?? "#6366F1"}
                  height="h-2"
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
