import Link from "next/link";
import type { SubscriptionState } from "@/lib/subscription";

interface OrgSubscriptionBannerProps {
  state: Extract<SubscriptionState, "restricted" | "frozen">;
  locale: string;
  className?: string;
}

function joinClasses(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function OrgSubscriptionBanner({
  state,
  locale,
  className,
}: OrgSubscriptionBannerProps) {
  const isHu = locale !== "en";
  const isFrozen = state === "frozen";

  const eyebrow = isHu ? "Előfizetés állapot" : "Subscription state";
  const title = isFrozen
    ? (isHu ? "A szervezet fiókja fagyasztva van" : "This organization is frozen")
    : (isHu ? "Lejárt előfizetés: korlátozott mód" : "Expired subscription: restricted mode");
  const description = isFrozen
    ? (isHu
      ? "Csak minimális összegző adatok érhetők el. Részletes insightok ideiglenesen nem böngészhetők."
      : "Only minimal summary data is available. Detailed insights are temporarily hidden.")
    : (isHu
      ? "A meglévő adatok olvashatók, de új akciók és szerkesztések le vannak tiltva a reaktiválásig."
      : "Existing data remains readable, but new actions and edits are disabled until reactivation.");

  return (
    <section
      className={joinClasses(
        "rounded-2xl border px-5 py-4 md:px-6",
        isFrozen
          ? "border-amber-200 bg-amber-50"
          : "border-sky-200 bg-sky-50",
        className,
      )}
    >
      <p
        className={joinClasses(
          "font-mono text-[10px] uppercase tracking-[0.18em]",
          isFrozen ? "text-amber-700" : "text-sky-700",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={joinClasses(
          "mt-1 font-fraunces text-xl",
          isFrozen ? "text-amber-900" : "text-sky-900",
        )}
      >
        {title}
      </h2>
      <p
        className={joinClasses(
          "mt-2 text-sm",
          isFrozen ? "text-amber-800" : "text-sky-800",
        )}
      >
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/billing/upgrade"
          className={joinClasses(
            "inline-flex min-h-[40px] items-center rounded-lg px-4 text-sm font-semibold text-white transition",
            isFrozen
              ? "bg-amber-700 hover:bg-amber-800"
              : "bg-sky-700 hover:bg-sky-800",
          )}
        >
          {isHu ? "Reaktiválás" : "Reactivate"}
        </Link>
        <Link
          href="/billing/checkout?plan=org_monthly"
          className={joinClasses(
            "inline-flex min-h-[40px] items-center rounded-lg border px-4 text-sm font-semibold transition",
            isFrozen
              ? "border-amber-300 text-amber-900 hover:bg-amber-100"
              : "border-sky-300 text-sky-900 hover:bg-sky-100",
          )}
        >
          {isHu ? "Előfizetés kezelése" : "Manage subscription"}
        </Link>
      </div>
    </section>
  );
}

