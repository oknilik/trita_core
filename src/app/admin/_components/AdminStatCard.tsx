interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon?: string;
  trend?: { value: number; period: string };
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  color,
  icon,
  trend,
}: AdminStatCardProps) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-6 md:p-8"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && <span className="text-4xl">{icon}</span>}
      </div>
      {trend && (
        <div
          className={`mt-3 text-sm font-medium ${
            trend.value >= 0 ? "text-green-600" : "text-rose-600"
          }`}
        >
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.period}
        </div>
      )}
    </div>
  );
}
