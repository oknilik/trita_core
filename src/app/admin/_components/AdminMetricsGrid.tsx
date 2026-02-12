export function AdminMetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      {children}
    </div>
  );
}
