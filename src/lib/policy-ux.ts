import type { AccessDenialReason, AccessUpgradeHintCode } from "@/lib/policy-engine";

export interface CapabilityGateCopy {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

const DEFAULT_CTA_HREF = "/billing/upgrade";

function resolveCtaHref(code: AccessUpgradeHintCode | undefined): string {
  if (code === "activate_subscription" || code === "reactivate_subscription") {
    return "/billing/upgrade";
  }
  return DEFAULT_CTA_HREF;
}

export function getCapabilityGateCopy(params: {
  locale: string;
  reason?: AccessDenialReason;
  upgradeHintCode?: AccessUpgradeHintCode;
}): CapabilityGateCopy {
  const isHu = params.locale !== "en";
  const ctaHref = resolveCtaHref(params.upgradeHintCode);

  if (
    params.reason === "SUBSCRIPTION_REQUIRED" ||
    params.reason === "SUBSCRIPTION_RESTRICTED" ||
    params.reason === "SUBSCRIPTION_FROZEN"
  ) {
    return isHu
      ? {
          title: "Ez az akció jelenleg nem érhető el",
          description:
            "A tartalom továbbra is megtekinthető, de a szerkesztési és indítási műveletek reaktiválásig tiltva vannak.",
          ctaLabel: "Előfizetés kezelése",
          ctaHref,
        }
      : {
          title: "This action is currently unavailable",
          description:
            "Content stays visible, but create/manage actions are disabled until reactivation.",
          ctaLabel: "Manage subscription",
          ctaHref,
        };
  }

  if (params.reason === "ROLE_INSUFFICIENT") {
    return isHu
      ? {
          title: "Magasabb jogosultság szükséges",
          description:
            "A tartalom látható, de ehhez az akcióhoz manager vagy admin jogosultság kell.",
          ctaLabel: "Részletek",
          ctaHref: "/platform/home",
        }
      : {
          title: "Higher permission required",
          description:
            "You can view this content, but this action requires manager or admin role.",
          ctaLabel: "Details",
          ctaHref: "/platform/home",
        };
  }

  return isHu
    ? {
        title: "Akció nem elérhető",
        description:
          "Ez a művelet jelenleg nem végrehajtható ezzel a hozzáférési állapottal.",
        ctaLabel: "Előfizetés kezelése",
        ctaHref,
      }
    : {
        title: "Action unavailable",
        description:
          "This action cannot be executed with the current access state.",
        ctaLabel: "Manage subscription",
        ctaHref,
      };
}

