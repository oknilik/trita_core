"use client";

export type AuthIntent = "explore" | "team";

interface IntentSelectorProps {
  value: AuthIntent;
  onChange: (intent: AuthIntent) => void;
}

const OPTIONS: { value: AuthIntent; icon: string; label: string; blurb: string }[] = [
  {
    value: "explore",
    icon: "🪞",
    label: "Önismeret",
    blurb: "Töltsd ki a személyiségtesztet és nézd meg, hogyan látnak mások.",
  },
  {
    value: "team",
    icon: "👥",
    label: "Csapatfejlesztés",
    blurb: "Hívd meg a csapatodat, és elemezd a dinamikát heatmappal.",
  },
];

export default function IntentSelector({ value, onChange }: IntentSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                "flex flex-col items-start rounded-lg border px-4 py-3 text-left transition",
                active
                  ? "border-[#c8410a] bg-[#fdf5f2]"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white",
              ].join(" ")}
            >
              <span className="mb-1 text-xl">{opt.icon}</span>
              <span
                className={[
                  "text-sm font-semibold",
                  active ? "text-[#c8410a]" : "text-gray-700",
                ].join(" ")}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">
        {OPTIONS.find((o) => o.value === value)?.blurb}
      </p>
    </div>
  );
}
