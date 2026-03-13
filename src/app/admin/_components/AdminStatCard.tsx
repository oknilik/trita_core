interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  trend?: { value: number; period: string };
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  color,
  trend,
}: AdminStatCardProps) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-6"
      style={{ borderTopWidth: "3px", borderTopColor: color }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
      )}
      {trend && (
        <div
          className={`mt-3 text-sm font-medium ${
            trend.value >= 0 ? "text-green-600" : "text-rose-600"
          }`}
        >
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
          {trend.period}
        </div>
      )}
    </div>
  );
}
