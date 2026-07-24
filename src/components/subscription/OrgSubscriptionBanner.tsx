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
          ? "border-slate-200 bg-slate-50"
          : isFrozen
          ? "border-amber-200 bg-amber-50"
          : "border-sky-200 bg-sky-50",
        className,
      )}
    >
      <p
        className={cn(
          "font-mono text-micro uppercase tracking-[0.18em]",
          isNone
            ? "text-slate-700"
            : isFrozen
              ? "text-amber-700"
              : "text-sky-700",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-1 font-fraunces text-xl",
          isNone
            ? "text-slate-900"
            : isFrozen
              ? "text-amber-900"
              : "text-sky-900",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-2 text-sm",
          isNone
            ? "text-slate-800"
            : isFrozen
              ? "text-amber-800"
              : "text-sky-800",
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
              ? "bg-slate-700 hover:bg-slate-800"
              : isFrozen
              ? "bg-amber-700 hover:bg-amber-800"
              : "bg-sky-700 hover:bg-sky-800",
          )}
        >
          {isHu ? (isNone ? "Előfizetés aktiválása" : "Reaktiválás") : (isNone ? "Activate subscription" : "Reactivate")}
        </Link>
      </div>
    </section>
  );
}
