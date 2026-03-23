export function StatsBar() {
  const stats = [
    { value: "100", label: "kérdés a tesztben" },
    { value: "300", suffix: "+", label: "elemzett adatpont" },
    { value: "6", label: "HEXACO dimenzió" },
    { value: "92", suffix: "%", label: "változtatott az ajánlások alapján" },
  ];

  return (
    <div className="mx-auto mt-12 max-w-[1120px] px-7">
      <div className="rounded-[20px] bg-[#1a1a2e] px-6 py-8 lg:px-12 lg:py-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-around">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-fraunces text-4xl font-normal tracking-tight text-white">
                {s.value}
                {s.suffix && (
                  <span style={{ color: "#e8a96a" }}>{s.suffix}</span>
                )}
              </div>
              <div className="mt-1 text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
