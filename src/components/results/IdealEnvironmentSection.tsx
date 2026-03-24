interface EnvItem {
  label: string;
  value: string;
}

interface IdealEnvironmentSectionProps {
  items: EnvItem[];
  isUnlocked: boolean;
}

// Pólus labelek és pozíció kiszámítása a szöveges értékből
const POLES: Record<string, { low: string; high: string }> = {
  Struktúra: { low: "szabad", high: "strukturált" },
  Structure: { low: "flexible", high: "structured" },
  "Társas intenzitás": { low: "egyéni", high: "csapatmunka" },
  "Social intensity": { low: "solo", high: "teamwork" },
  Változásgyakoriság: { low: "stabil", high: "változó" },
  "Change frequency": { low: "stable", high: "dynamic" },
  "Döntési sebesség": { low: "lassú", high: "gyors" },
  "Decision pace": { low: "slow", high: "fast" },
  Stressztűrés: { low: "alacsony", high: "magas" },
  "Stress tolerance": { low: "low", high: "high" },
  Projektciklus: { low: "rövid", high: "hosszú" },
  "Project cycle": { low: "short", high: "long" },
  Kultúra: { low: "pragmatikus", high: "értékvezérelt" },
  Culture: { low: "pragmatic", high: "values-driven" },
};

function getPosition(value: string): number {
  const v = value.toLowerCase();
  if (v.startsWith("magas") || v.startsWith("high")) return 80;
  if (v.startsWith("alacsony") || v.startsWith("low")) return 20;
  if (v.startsWith("közepes") || v.startsWith("medium")) return 50;
  if (v.startsWith("rövid") || v.startsWith("short")) return 30;
  if (v.startsWith("hosszú") || v.startsWith("long")) return 75;
  if (v.startsWith("gyors") || v.startsWith("fast")) return 78;
  if (v.startsWith("értékvezérelt") || v.startsWith("values")) return 80;
  if (v.startsWith("teljesítmény") || v.startsWith("performance")) return 25;
  return 50;
}

function getMarkerColor(pos: number): string {
  return pos >= 65 ? "bg-[#3d6b5e]" : pos <= 35 ? "bg-[#8a8a9a]" : "bg-[#c17f4a]";
}

function getDescription(value: string): string {
  const dashIdx = value.indexOf(" – ");
  const dashIdx2 = value.indexOf(" — ");
  const idx = dashIdx2 >= 0 ? dashIdx2 : dashIdx;
  return idx >= 0 ? value.slice(idx + 3).trim() : value;
}

export function IdealEnvironmentSection({ items, isUnlocked }: IdealEnvironmentSectionProps) {
  if (!isUnlocked || items.length === 0) return null;

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3d6b5e]" />
        <p className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
          Ideális környezet
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => {
          const poles = POLES[item.label] ?? { low: "", high: "" };
          const pos = getPosition(item.value);
          const markerColor = getMarkerColor(pos);
          const desc = getDescription(item.value);

          return (
            <div
              key={item.label}
              className="flex flex-col gap-2 rounded-[10px] border border-[#e8e0d3] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="text-xs font-medium text-[#1a1a2e] sm:w-[130px] sm:shrink-0">
                {item.label}
              </span>
              <div className="min-w-0 flex-1">
                {/* Track container — marker centered on track via flex */}
                <div className="flex items-center" style={{ height: 10 }}>
                  <div className="relative h-1 w-full rounded-sm bg-[#e8e0d3]">
                    <div
                      className="absolute top-1/2 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm"
                      style={{
                        left: `clamp(5px, ${pos}%, calc(100% - 5px))`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: pos >= 65 ? "#3d6b5e" : pos <= 35 ? "#8a8a9a" : "#c17f4a",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-[9px] text-[#8a8a9a]">{poles.low}</span>
                  <span className="text-[9px] text-[#8a8a9a]">{poles.high}</span>
                </div>
              </div>
              <span className="text-[11px] text-[#8a8a9a] sm:w-[180px] sm:shrink-0 sm:text-right">
                {desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
