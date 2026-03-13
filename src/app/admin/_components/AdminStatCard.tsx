interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; period: string };
}

export function AdminStatCard({ title, value, subtitle, trend }: AdminStatCardProps) {
  return (
    <div
      className="rounded-xl border border-[#e8e4dc] bg-white p-6"
      style={{ borderTopWidth: "3px", borderTopColor: "#c8410a" }}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold text-[#1a1814]">{value}</p>
      {subtitle && (
        <p className="mt-1.5 text-xs text-[#5a5650]">{subtitle}</p>
      )}
      {trend && (
        <div
          className={`mt-3 text-xs font-semibold ${
            trend.value >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.period}
        </div>
      )}
    </div>
  );
}
