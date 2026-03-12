import type { Locale } from "@/lib/i18n";

const statsData: Record<Locale, Array<{ value: string; label: string }>> = {
  hu: [
    { value: "18", label: "csapat elemezve" },
    { value: "126", label: "kitöltött felmérés" },
    { value: "48h", label: "átlagos idő az első csapatképig" },
    { value: "3–6×", label: "havi bér veszteség egy rossz hire-nál" },
  ],
  en: [
    { value: "18", label: "teams analyzed" },
    { value: "126", label: "surveys completed" },
    { value: "48h", label: "avg. time to first team profile" },
    { value: "3–6×", label: "monthly salary lost on a bad hire" },
  ],
};

export function StatsSection({ locale }: { locale: Locale }) {
  const stats = statsData[locale] ?? statsData.hu;

  return (
    <section className="border-b border-[#e0ddd6] bg-[#1a1814] px-6 lg:px-16">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((item, index) => (
          <div
            key={item.value}
            className={`py-5 text-center md:py-7 ${index % 2 === 0 ? "border-r border-white/10 md:border-r" : "md:border-r md:border-white/10"} ${index >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${index === 3 ? "md:border-r-0" : ""}`}
          >
            <div className="font-playfair mb-1 text-[28px] leading-none font-black tracking-[-1px] text-white lg:text-4xl">
              {item.value}
            </div>
            <div className="font-ibm-plex-mono px-2 text-[11px] tracking-[0.5px] text-white/40">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
