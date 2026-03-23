import { UpgradeButton } from "./UpgradeButton";

type ProfileLevel = "start" | "plus" | "reflect";

const LEVEL_RANK: Record<ProfileLevel, number> = { start: 0, plus: 1, reflect: 2 };
const TIER_MAP: Record<"plus" | "reflect", string> = {
  plus: "self_plus",
  reflect: "self_reflect",
};

interface LockedSectionProps {
  requiredLevel: "plus" | "reflect";
  currentLevel: ProfileLevel;
  title: string;
  teaser: string;
  upgradePrice: string;
  upgradeTier: string;
  upgradeCta: string;
  children?: React.ReactNode;
}

export function LockedSection({
  requiredLevel,
  currentLevel,
  title,
  teaser,
  upgradePrice,
  upgradeTier,
  upgradeCta,
  children,
}: LockedSectionProps) {
  const isUnlocked = LEVEL_RANK[currentLevel] >= LEVEL_RANK[requiredLevel];

  if (isUnlocked) {
    return (
      <section>
        <h2 className="mb-6 font-fraunces text-2xl text-ink">{title}</h2>
        {children}
      </section>
    );
  }

  // Locked: static placeholder + upgrade CTA (no real data transmitted)
  return (
    <section>
      <h2 className="mb-6 font-fraunces text-2xl text-ink">{title}</h2>
      <div className="relative overflow-hidden rounded-2xl border border-sand bg-white">
        {/* Static blurred placeholder — NOT real data */}
        <div
          className="pointer-events-none select-none px-6 py-5 opacity-25"
          style={{ filter: "blur(4px)" }}
          aria-hidden="true"
        >
          <div className="space-y-4">
            {[72, 56, 88, 44, 63, 78].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 rounded bg-sage/20" style={{ width: `${w}%` }} />
                <div className="h-2 w-10 rounded bg-sand" />
              </div>
            ))}
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-white/80 px-6 py-10 backdrop-blur-[2px]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sand bg-cream">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="#c17f4a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="9" width="14" height="10" rx="2" />
              <path d="M7 9V6a3 3 0 0 1 6 0v3" />
            </svg>
          </div>
          <div className="max-w-sm text-center">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              {upgradeTier} · {upgradePrice}
            </p>
            <p className="text-sm leading-relaxed text-ink-body">{teaser}</p>
          </div>
          <UpgradeButton tier={TIER_MAP[requiredLevel]} label={upgradeCta} />
        </div>
      </div>
    </section>
  );
}
