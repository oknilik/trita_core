import type { AccessDenialReason, AccessUpgradeHintCode } from "@/lib/policy-engine";

export interface CapabilityGateCopy {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

// Consulting mode: subscriptions are provisioned manually, so every
// activation path routes to the contact page instead of a checkout.
const DEFAULT_CTA_HREF = "/contact";

function resolveCtaHref(code: AccessUpgradeHintCode | undefined): string {
  if (code === "activate_subscription" || code === "reactivate_subscription") {
    return "/contact";
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
          title: "Ez a művelet jelenleg nem érhető el",
          description:
            "Az eredményeket továbbra is megnézheted. Szerkeszteni és új mérést indítani a hozzáférés megújítása után tudsz.",
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
            "A tartalmat megnézheted, de ehhez a művelethez vezetői vagy adminisztrátori jogosultság szükséges.",
          ctaLabel: "Részletek",
          ctaHref: "/dashboard",
        }
      : {
          title: "Higher permission required",
          description:
            "You can view this content, but this action requires manager or admin role.",
          ctaLabel: "Details",
          ctaHref: "/dashboard",
        };
  }

  return isHu
    ? {
        title: "A művelet nem érhető el",
        description:
          "A jelenlegi hozzáféréseddel ezt a műveletet nem tudod elvégezni.",
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

