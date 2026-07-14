import type { Locale } from "@/lib/i18n";

export interface SelfPricingPlan {
  id: "self_start";
  name: string;
  description: string;
  price: string;
  perMonth: string;
  seats: string;
  features: string[];
  badge?: string;
  ctaHref: string;
}

export interface TeamPricingPlan {
  id: "snapshot" | "team";
  name: string;
  description: string;
  price: string;
  perMonth: string;
  seats: string;
  features: string[];
  badge?: string;
  ctaHref: string;
  ctaLabel?: string;
}

export interface OrgPricingPlan {
  id: "org" | "scale";
  name: string;
  description: string;
  price: string;
  perMonth: string;
  seats: string;
  features: string[];
  badge?: string;
  ctaHref: string;
  isCustom?: boolean;
}

const selfPricingPlansData: Record<Locale, SelfPricingPlan[]> = {
  hu: [
    {
      id: "self_start",
      name: "Free",
      description: "Ismerd meg magad — az egyéni felmérés ingyenes.",
      price: "Ingyenes",
      perMonth: "",
      seats: "",
      features: [
        "1 teljes személyiségfelmérés",
        "Dimenzió szintű riport",
        "Max 2 observer meghívás",
        "Önkép vs. observer összehasonlítás",
        "Eredmények és visszajelzések megtekintése",
      ],
      ctaHref: "/try",
    },
  ],
  en: [
    {
      id: "self_start",
      name: "Free",
      description: "Get to know yourself — the individual assessment is free.",
      price: "Free",
      perMonth: "",
      seats: "",
      features: [
        "1 full personality assessment",
        "Dimension-level report",
        "Max 2 observer invites",
        "Self vs. observer comparison",
        "View results and feedback",
      ],
      ctaHref: "/try",
    },
  ],
};

const teamPricingPlansData: Record<Locale, TeamPricingPlan[]> = {
  hu: [
    {
      id: "snapshot",
      name: "Team Snapshot",
      description: "Egyszeri csapatdiagnózis — nézd meg, hol tartotok.",
      price: "€99",
      perMonth: "",
      seats: "egyszeri díj · 1 csapat · tájékoztató ár",
      features: [
        "Self-assessment minden tagnak",
        "Observer visszajelzés",
        "Csapat dashboard és heatmap",
        "Önkép vs. observer összevetés",
        "1 összefoglaló riport",
      ],
      ctaHref: "/contact",
    },
    {
      id: "team",
      name: "Team",
      description: "Folyamatos csapatműködési platform.",
      price: "€49",
      perMonth: "/hó",
      seats: "10 főig · tájékoztató ár",
      features: [
        "Minden Snapshot funkció",
        "Folyamatos hozzáférés és újramérés",
        "Trendek és history",
        "Korlátlan observer körök",
        "Jelölt értékelés (add-on)",
      ],
      badge: "Legnépszerűbb",
      ctaHref: "/contact",
    },
  ],
  en: [
    {
      id: "snapshot",
      name: "Team Snapshot",
      description: "One-time team diagnosis — see where you stand.",
      price: "€99",
      perMonth: "",
      seats: "one-time fee · 1 team · indicative price",
      features: [
        "Self-assessment for every member",
        "Observer feedback",
        "Team dashboard and heatmap",
        "Self vs. observer comparison",
        "1 summary report",
      ],
      ctaHref: "/contact",
    },
    {
      id: "team",
      name: "Team",
      description: "Continuous team operations platform.",
      price: "€49",
      perMonth: "/mo",
      seats: "up to 10 members · indicative price",
      features: [
        "Everything in Snapshot",
        "Continuous access and re-assessment",
        "Trends and history",
        "Unlimited observer rounds",
        "Candidate assessment (add-on)",
      ],
      badge: "Most popular",
      ctaHref: "/contact",
    },
  ],
};

const orgPricingPlansData: Record<Locale, OrgPricingPlan[]> = {
  hu: [
    {
      id: "org",
      name: "Org",
      description: "Növekvő szervezeteknek, több csapattal.",
      price: "€149",
      perMonth: "/hó",
      seats: "40 főig · tájékoztató ár",
      features: [
        "Minden Team funkció",
        "Több csapat kezelése egy szervezetben",
        "Org szerepkörök: admin, manager, member",
        "Tag- és csapatmeghívás jogosultság alapon",
        "Candidate flow manager jogosultsággal",
        "Szervezeti szintű összehasonlítás",
      ],
      ctaHref: "/contact",
    },
    {
      id: "scale",
      name: "Scale",
      description: "Egyedi bevezetés nagyobb szervezeteknek.",
      price: "Egyedi",
      perMonth: "ajánlat",
      seats: "41+ fő",
      features: [
        "Minden Org funkció",
        "Dedikált onboarding és rollout támogatás",
        "Priority support csatorna",
        "Egyedi szerződéses és számlázási feltételek",
        "SLA és adatfeldolgozási megállapodás",
      ],
      ctaHref: "/contact",
      isCustom: true,
    },
  ],
  en: [
    {
      id: "org",
      name: "Org",
      description: "For growing organizations with multiple teams.",
      price: "€149",
      perMonth: "/mo",
      seats: "up to 40 members · indicative price",
      features: [
        "Everything in Team",
        "Multiple teams in one organization",
        "Org roles: admin, manager, member",
        "Member and team invitations by role",
        "Candidate flow with manager permissions",
        "Organization-level comparison",
      ],
      ctaHref: "/contact",
    },
    {
      id: "scale",
      name: "Scale",
      description: "Custom rollout for larger organizations.",
      price: "Custom",
      perMonth: "quote",
      seats: "41+ members",
      features: [
        "Everything in Org",
        "Dedicated onboarding and rollout support",
        "Priority support channel",
        "Custom contract and billing terms",
        "SLA and data processing agreement",
      ],
      ctaHref: "/contact",
      isCustom: true,
    },
  ],
};

export function getSelfPricingPlans(locale: Locale): SelfPricingPlan[] {
  return selfPricingPlansData[locale] ?? selfPricingPlansData.hu;
}

export function getTeamPricingPlans(locale: Locale): TeamPricingPlan[] {
  return teamPricingPlansData[locale] ?? teamPricingPlansData.hu;
}

export function getOrgPricingPlans(locale: Locale): OrgPricingPlan[] {
  return orgPricingPlansData[locale] ?? orgPricingPlansData.hu;
}
