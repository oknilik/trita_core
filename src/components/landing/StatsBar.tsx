"use client";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function StatsBar() {
  const { locale } = useLocale();

  const stats = [
    { value: "~15", suffix: t("landing.statMinSuffix", locale), label: t("landing.statMinLabel", locale) },
    { value: "6", suffix: "", label: t("landing.statDimLabel", locale) },
    { value: t("landing.statResultValue", locale), suffix: "", label: t("landing.statResultLabel", locale), isText: true },
    { value: t("landing.statSelfValue", locale), suffix: "", label: t("landing.statSelfLabel", locale), isText: true },
  ];

  return (
    <div className="mx-auto max-w-[1120px] px-7">
      <div className="rounded-[20px] bg-[#1a1a2e] px-8 py-10 lg:px-12">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end lg:justify-around">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <div className={["flex min-h-[40px] items-end font-fraunces tracking-tight text-white", s.isText ? "text-xl font-semibold" : "text-[32px] font-normal"].join(" ")}>
                {s.value}
                {s.suffix && <span style={{ color: "#e8a96a" }}>{s.suffix}</span>}
              </div>
              <div className="mt-1 text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
