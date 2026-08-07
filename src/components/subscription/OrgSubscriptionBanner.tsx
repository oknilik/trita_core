import Link from "next/link";
import type { SubscriptionState } from "@/lib/subscription";
import { cn } from "@/lib/ui/cn";

interface OrgSubscriptionBannerProps {
  state: Extract<SubscriptionState, "none" | "restricted" | "frozen">;
  locale: string;
  className?: string;
}

export function OrgSubscriptionBanner({
  state,
  locale,
  className,
}: OrgSubscriptionBannerProps) {
  const isHu = locale !== "en";
  const isNone = state === "none";
  const isFrozen = state === "frozen";

  const eyebrow = isHu ? "Előfizetés állapot" : "Subscription state";
  const title = isNone
    ? (isHu ? "Nincs aktív szervezeti előfizetés" : "No active organization subscription")
    : isFrozen
    ? (isHu ? "A szervezet fiókja fagyasztva van" : "This organization is frozen")
    : (isHu ? "Lejárt előfizetés: korlátozott mód" : "Expired subscription: restricted mode");
  const description = isNone
    ? (isHu
      ? "A szervezeti oldalak olvashatók maradnak, de új akciók és szerkesztések előfizetés nélkül nem érhetők el."
      : "Organization pages remain readable, but create/manage actions are unavailable without an active subscription.")
    : isFrozen
    ? (isHu
      ? "Csak minimális összegző adatok érhetők el. Részletes insightok ideiglenesen nem böngészhetők."
      : "Only minimal summary data is available. Detailed insights are temporarily hidden.")
    : (isHu
      ? "A meglévő adatok olvashatók, de új akciók és szerkesztések le vannak tiltva a reaktiválásig."
      : "Existing data remains readable, but new actions and edits are disabled until reactivation.");

  return (
    <section
      className={cn(
        "rounded-2xl border px-5 py-4 md:px-6",
        isNone
          ? "border-cream-300 bg-cream"
          : isFrozen
          ? "border-state-warning-border bg-state-warning-bg"
          : "border-state-info-border bg-state-info-bg",
        className,
      )}
    >
      <p
        className={cn(
          "font-mono text-micro uppercase tracking-widest",
          isNone
            ? "text-ink-body"
            : isFrozen
              ? "text-state-warning-fg"
              : "text-layer-org-bright",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-1 font-fraunces text-xl",
          isNone
            ? "text-ink"
            : isFrozen
              ? "text-accent-earth-strong"
              : "text-layer-org-accent",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-2 text-sm",
          isNone
            ? "text-ink"
            : isFrozen
              ? "text-bronze-700"
              : "text-layer-org-accent",
        )}
      >
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/contact"
          className={cn(
            "inline-flex min-h-[40px] items-center rounded-lg px-4 text-sm font-semibold text-white transition",
            isNone
              ? "bg-[var(--color-surface-inverse-soft)] hover:bg-[var(--color-surface-inverse)]"
              : isFrozen
              ? "bg-state-warning-fg hover:bg-bronze-700"
              : "bg-layer-org-bright hover:bg-layer-org-accent",
          )}
        >
          {isHu ? (isNone ? "Előfizetés aktiválása" : "Reaktiválás") : (isNone ? "Activate subscription" : "Reactivate")}
        </Link>
      </div>
    </section>
  );
}
