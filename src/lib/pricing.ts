import type { Locale } from "@/lib/i18n";

export interface SelfPricingPlan {
  id: "self_start" | "self_plus" | "self_reflect";
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
  id: "starter" | "team";
  name: string;
  description: string;
  price: string;
  perMonth: string;
  seats: string;
  features: string[];
  badge?: string;
  ctaHref: string;
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

export interface PricingPlan {
  id: "team" | "org" | "scale";
  name: string;
  price: string;
  cadence: string;
  seats: string;
  description: string;
  valuePromise: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "outline";
  badge?: string;
}

export interface PricingAddOn {
  label: string;
  value: string;
}

export type BillingMode = "annual" | "monthly";

export interface PricingDisplayPlan {
  id: "team" | "org" | "scale";
  name: string;
  badge?: string;
  description: string;
  valuePromise: string;
  annualPrice: string;
  monthlyPrice: string;
  cadence: string;
  seatLabel: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "primary" | "outline";
  highlights: string[];
}

export interface PricingComparisonRow {
  label: string;
  team: string;
  org: string;
  scale: string;
}

export interface PricingFaqItem {
  question: string;
  answer: string;
}

const pricingPlansData: Record<Locale, PricingPlan[]> = {
  hu: [
    {
      id: "team",
      name: "Team",
      price: "€49",
      cadence: "/hó",
      seats: "10 seatig · éves számlázás",
      description: "Kis csapatoknak, gyors indulással.",
      valuePromise: "Előbb látod a csapatfeszültséget, mint hogy költséggé válna.",
      features: [
        "Self-assessment + observer visszajelzés",
        "Önkép vs. observer összehasonlítás",
        "Csapat RadarChart dashboard",
        "1 csapat kezelése",
        "Manager nézet és meghívások",
      ],
      ctaLabel: "Kipróbálom 14 napig ingyen",
      ctaHref: "/sign-up",
      ctaVariant: "primary",
      badge: "Legnépszerűbb",
    },
    {
      id: "org",
      name: "Org",
      price: "€149",
      cadence: "/hó",
      seats: "40 seatig",
      description: "Növekvő szervezeteknek, több csapattal.",
      valuePromise: "Szervezeti szinten is átlátod, hol csúszik együttműködés vagy illeszkedés.",
      features: [
        "Minden Team funkció",
        "Több csapat kezelése egy szervezetben",
        "Org szerepkörök: admin, manager, member",
        "Tag- és csapatmeghívás jogosultság alapon",
        "Candidate flow indítás manager jogosultsággal",
      ],
      ctaLabel: "Elindítom a szervezetet",
      ctaHref: "/sign-up",
      ctaVariant: "outline",
    },
    {
      id: "scale",
      name: "Scale",
      price: "Egyedi",
      cadence: "ajánlat",
      seats: "41+ seat",
      description: "Komplex bevezetésekhez és egyedi működéshez.",
      valuePromise: "Egyedi bevezetési keret, hogy gyorsabban legyen üzleti hatása a rendszernek.",
      features: [
        "Minden Org funkció",
        "Dedikált onboarding és rollout támogatás",
        "Priority support csatorna",
        "Egyedi szerződéses és számlázási feltételek",
      ],
      ctaLabel: "Beszéljünk róla",
      ctaHref: "/contact",
      ctaVariant: "outline",
    },
  ],
  en: [
    {
      id: "team",
      name: "Team",
      price: "€49",
      cadence: "/mo",
      seats: "up to 10 seats · annual billing",
      description: "For small teams, quick to launch.",
      valuePromise: "Spot team tension before it becomes a cost.",
      features: [
        "Self-assessment + observer feedback",
        "Self vs. observer comparison",
        "Team RadarChart dashboard",
        "Manage 1 team",
        "Manager view and invitations",
      ],
      ctaLabel: "Try free for 14 days",
      ctaHref: "/sign-up",
      ctaVariant: "primary",
      badge: "Most popular",
    },
    {
      id: "org",
      name: "Org",
      price: "€149",
      cadence: "/mo",
      seats: "up to 40 seats",
      description: "For growing organizations with multiple teams.",
      valuePromise: "See at org level where collaboration or fit is slipping.",
      features: [
        "Everything in Team",
        "Multiple teams in one organization",
        "Org roles: admin, manager, member",
        "Member and team invitations by role",
        "Candidate flow with manager permissions",
      ],
      ctaLabel: "Launch my organization",
      ctaHref: "/sign-up",
      ctaVariant: "outline",
    },
    {
      id: "scale",
      name: "Scale",
      price: "Custom",
      cadence: "quote",
      seats: "41+ seats",
      description: "For complex rollouts and custom setups.",
      valuePromise: "Custom implementation framework for faster business impact.",
      features: [
        "Everything in Org",
        "Dedicated onboarding and rollout support",
        "Priority support channel",
        "Custom contract and billing terms",
      ],
      ctaLabel: "Let's talk",
      ctaHref: "/contact",
      ctaVariant: "outline",
    },
  ],
};

const pricingAddOnsData: Record<Locale, PricingAddOn[]> = {
  hu: [
    { label: "Extra seat", value: "+€19 / fő / hó" },
    { label: "Jelölt értékelés", value: "+€39 / értékelés" },
    { label: "Próbaidőszak", value: "14 nap, kártyaadat nélkül" },
  ],
  en: [
    { label: "Extra seat", value: "+€19 / user / mo" },
    { label: "Candidate assessment", value: "+€39 / assessment" },
    { label: "Trial period", value: "14 days, no card required" },
  ],
};

const pricingDisplayPlansData: Record<Locale, PricingDisplayPlan[]> = {
  hu: [
    {
      id: "team",
      name: "Team",
      badge: "Legnépszerűbb",
      description: "Kis csapatoknak, gyors indulással.",
      valuePromise: "Előbb látod a csapatfeszültséget, mint hogy költséggé válna.",
      annualPrice: "€49",
      monthlyPrice: "€59",
      cadence: "/hó",
      seatLabel: "10 seatig",
      ctaLabel: "Kipróbálom ingyen",
      ctaHref: "/sign-up",
      ctaVariant: "primary",
      highlights: [
        "Self-assessment + observer visszajelzés",
        "Önkép vs. observer összehasonlítás",
        "Csapat RadarChart dashboard",
        "1 csapat kezelése",
        "Manager nézet és meghívások",
      ],
    },
    {
      id: "org",
      name: "Org",
      description: "Növekvő szervezeteknek, több csapattal.",
      valuePromise: "Szervezeti szinten is átlátod, hol csúszik együttműködés vagy illeszkedés.",
      annualPrice: "€149",
      monthlyPrice: "€179",
      cadence: "/hó",
      seatLabel: "40 seatig",
      ctaLabel: "Elindítom a szervezetet",
      ctaHref: "/sign-up",
      ctaVariant: "outline",
      highlights: [
        "Minden Team funkció",
        "Több csapat kezelése egy szervezetben",
        "Org szerepkörök: admin, manager, member",
        "Tag- és csapatmeghívás jogosultság alapon",
        "Candidate flow indítás manager jogosultsággal",
      ],
    },
    {
      id: "scale",
      name: "Scale",
      description: "Komplex bevezetésekhez és egyedi működéshez.",
      valuePromise: "Egyedi bevezetési keret, hogy gyorsabban legyen üzleti hatása a rendszernek.",
      annualPrice: "Egyedi",
      monthlyPrice: "Egyedi",
      cadence: "ajánlat",
      seatLabel: "41+ seat",
      ctaLabel: "Beszéljünk róla",
      ctaHref: "/contact",
      ctaVariant: "outline",
      highlights: [
        "Minden Org funkció",
        "Dedikált onboarding és rollout támogatás",
        "Priority support csatorna",
        "Egyedi szerződéses és számlázási feltételek",
      ],
    },
  ],
  en: [
    {
      id: "team",
      name: "Team",
      badge: "Most popular",
      description: "For small teams, quick to launch.",
      valuePromise: "Spot team tension before it becomes a cost.",
      annualPrice: "€49",
      monthlyPrice: "€59",
      cadence: "/mo",
      seatLabel: "up to 10 seats",
      ctaLabel: "Try for free",
      ctaHref: "/sign-up",
      ctaVariant: "primary",
      highlights: [
        "Self-assessment + observer feedback",
        "Self vs. observer comparison",
        "Team RadarChart dashboard",
        "Manage 1 team",
        "Manager view and invitations",
      ],
    },
    {
      id: "org",
      name: "Org",
      description: "For growing organizations with multiple teams.",
      valuePromise: "See at org level where collaboration or fit is slipping.",
      annualPrice: "€149",
      monthlyPrice: "€179",
      cadence: "/mo",
      seatLabel: "up to 40 seats",
      ctaLabel: "Launch my organization",
      ctaHref: "/sign-up",
      ctaVariant: "outline",
      highlights: [
        "Everything in Team",
        "Multiple teams in one organization",
        "Org roles: admin, manager, member",
        "Member and team invitations by role",
        "Candidate flow with manager permissions",
      ],
    },
    {
      id: "scale",
      name: "Scale",
      description: "For complex rollouts and custom setups.",
      valuePromise: "Custom framework for faster business impact.",
      annualPrice: "Custom",
      monthlyPrice: "Custom",
      cadence: "quote",
      seatLabel: "41+ seats",
      ctaLabel: "Let's talk",
      ctaHref: "/contact",
      ctaVariant: "outline",
      highlights: [
        "Everything in Org",
        "Dedicated onboarding and rollout support",
        "Priority support channel",
        "Custom contract and billing terms",
      ],
    },
  ],
};

const pricingComparisonRowsData: Record<Locale, PricingComparisonRow[]> = {
  hu: [
    { label: "Csapatok száma", team: "1", org: "Korlátlan", scale: "Korlátlan" },
    { label: "Observer visszajelzés", team: "Igen", org: "Igen", scale: "Igen" },
    { label: "Org szerepkörök", team: "Nem", org: "Igen", scale: "Igen" },
    { label: "Candidate flow", team: "Add-on", org: "Igen", scale: "Igen" },
    { label: "Dedikált onboarding", team: "Nem", org: "Alap", scale: "Kiterjesztett" },
    { label: "Támogatás", team: "Email", org: "Prioritásos", scale: "Dedikált" },
  ],
  en: [
    { label: "Teams", team: "1", org: "Unlimited", scale: "Unlimited" },
    { label: "Observer feedback", team: "Yes", org: "Yes", scale: "Yes" },
    { label: "Org roles", team: "No", org: "Yes", scale: "Yes" },
    { label: "Candidate flow", team: "Add-on", org: "Yes", scale: "Yes" },
    { label: "Dedicated onboarding", team: "No", org: "Basic", scale: "Extended" },
    { label: "Support", team: "Email", org: "Priority", scale: "Dedicated" },
  ],
};

const pricingFaqsData: Record<Locale, PricingFaqItem[]> = {
  hu: [
    {
      question: "Hogyan működik a 14 napos próba?",
      answer:
        "Azonnal indítható, kártyaadat nélkül. A próba alatt minden Team funkció elérhető, és bármikor lemondható.",
    },
    {
      question: "Mit jelent a seat?",
      answer:
        "Egy seat egy aktív felhasználói hozzáférést jelent a szervezeten belül. A seat-ek száma bármikor növelhető.",
    },
    {
      question: "A candidate értékelés benne van a csomagban?",
      answer:
        "Alapesetben külön add-on. Így csak akkor fizetsz érte, amikor ténylegesen futtatod a jelöltértékelést.",
    },
    {
      question: "Van éves kedvezmény?",
      answer:
        "Igen. Az éves számlázásnál kedvezőbb havi díjat kapsz, mint havi számlázás esetén.",
    },
    {
      question: "Melyik csomag kell, ha több csapatot kezelünk?",
      answer:
        "Több csapat vagy szervezeti szerepkörök esetén az Org csomag a megfelelő kiindulópont.",
    },
    {
      question: "Scale csomag esetén hogyan indulunk?",
      answer:
        "A kapcsolat oldalon keresztül egyeztetünk az igényekről, és egyedi bevezetési + árazási ajánlatot adunk.",
    },
  ],
  en: [
    {
      question: "How does the 14-day trial work?",
      answer:
        "Starts immediately, no credit card required. All Team features are available during the trial, and you can cancel at any time.",
    },
    {
      question: "What is a seat?",
      answer:
        "A seat is one active user access within the organization. The number of seats can be increased at any time.",
    },
    {
      question: "Is candidate assessment included in the plan?",
      answer:
        "By default it is a separate add-on. This way you only pay for it when you actually run a candidate assessment.",
    },
    {
      question: "Is there an annual discount?",
      answer:
        "Yes. Annual billing gives you a lower monthly rate compared to monthly billing.",
    },
    {
      question: "Which plan do I need if we manage multiple teams?",
      answer:
        "For multiple teams or organizational roles, the Org plan is the right starting point.",
    },
    {
      question: "How do we get started with the Scale plan?",
      answer:
        "We'll discuss your needs via the contact page and provide a custom implementation and pricing proposal.",
    },
  ],
};

const selfPricingPlansData: Record<Locale, SelfPricingPlan[]> = {
  hu: [
    {
      id: "self_start",
      name: "Self Start",
      description: "Ismerd meg magad — az alapok, ingyenesen.",
      price: "Ingyenes",
      perMonth: "",
      seats: "",
      features: [
        "1 személyiségteszt (HEXACO)",
        "Dimenzió szintű eredmények",
        "Max 2 observer meghívás",
        "Önkép vs. observer összehasonlítás",
        "Eredmények és visszajelzések megtekintése",
      ],
      ctaHref: "/try",
    },
    {
      id: "self_plus",
      name: "Self Plus",
      description: "Nézz a fő dimenziók mögé.",
      price: "€7",
      perMonth: "",
      seats: "egyszeri vásárlás",
      features: [
        "Minden Self Start funkció",
        "25 alskála részletesen",
        "Fejlődési fókusz és vakfoltok",
        "Karrierillesztés és szerepkör-javaslatok",
        "PDF eredményexport",
      ],
      badge: "Legnépszerűbb",
      ctaHref: "/try",
    },
    {
      id: "self_reflect",
      name: "Self Reflect",
      description: "Hogyan látnak mások? Observer visszajelzés elemzés.",
      price: "€12",
      perMonth: "",
      seats: "egyszeri vásárlás",
      features: [
        "Minden Self Plus funkció",
        "Korlátlan observer meghívás",
        "Önkép vs. observer összehasonlítás (részletes)",
        "Vakfolt-elemzés",
        "Observer visszajelzés riport",
      ],
      ctaHref: "/try",
    },
  ],
  en: [
    {
      id: "self_start",
      name: "Self Start",
      description: "Get to know yourself — the basics, free.",
      price: "Free",
      perMonth: "",
      seats: "",
      features: [
        "1 personality assessment (HEXACO)",
        "Dimension-level results",
        "Max 2 observer invites",
        "Self vs. observer comparison",
        "View results and feedback",
      ],
      ctaHref: "/try",
    },
    {
      id: "self_plus",
      name: "Self Plus",
      description: "Look beyond the main dimensions.",
      price: "€7",
      perMonth: "",
      seats: "one-time purchase",
      features: [
        "Everything in Self Start",
        "25 subscales in detail",
        "Growth focus and blind spots",
        "Career fit and role suggestions",
        "PDF results export",
      ],
      badge: "Most popular",
      ctaHref: "/try",
    },
    {
      id: "self_reflect",
      name: "Self Reflect",
      description: "How do others see you? Observer feedback analysis.",
      price: "€12",
      perMonth: "",
      seats: "one-time purchase",
      features: [
        "Everything in Self Plus",
        "Unlimited observer invites",
        "Self vs. observer comparison (detailed)",
        "Blind spot analysis",
        "Observer feedback report",
      ],
      ctaHref: "/try",
    },
  ],
};

const teamPricingPlansData: Record<Locale, TeamPricingPlan[]> = {
  hu: [
    {
      id: "starter",
      name: "Starter",
      description: "Kis csapatoknak, gyors indulással.",
      price: "€29",
      perMonth: "/hó",
      seats: "5 főig · éves számlázás",
      features: [
        "Self-assessment minden tagnak",
        "Observer visszajelzés (max 3/fő)",
        "Csapat RadarChart dashboard",
        "Önkép vs. observer összehasonlítás",
        "Manager nézet és meghívások",
      ],
      ctaHref: "/sign-up",
    },
    {
      id: "team",
      name: "Team",
      description: "Növekvő csapatoknak, teljes funkcionalitással.",
      price: "€49",
      perMonth: "/hó",
      seats: "10 főig · éves számlázás",
      features: [
        "Minden Starter funkció",
        "Korlátlan observer meghívás",
        "Csapatdinamika elemzés és riportok",
        "Jelölt értékelés (add-on)",
        "Priority email support",
      ],
      badge: "Legnépszerűbb",
      ctaHref: "/sign-up",
    },
  ],
  en: [
    {
      id: "starter",
      name: "Starter",
      description: "For small teams, quick to launch.",
      price: "€29",
      perMonth: "/mo",
      seats: "up to 5 members · annual billing",
      features: [
        "Self-assessment for every member",
        "Observer feedback (max 3/person)",
        "Team RadarChart dashboard",
        "Self vs. observer comparison",
        "Manager view and invitations",
      ],
      ctaHref: "/sign-up",
    },
    {
      id: "team",
      name: "Team",
      description: "For growing teams, with full feature access.",
      price: "€49",
      perMonth: "/mo",
      seats: "up to 10 members · annual billing",
      features: [
        "Everything in Starter",
        "Unlimited observer invitations",
        "Team dynamics analysis and reports",
        "Candidate assessment (add-on)",
        "Priority email support",
      ],
      badge: "Most popular",
      ctaHref: "/sign-up",
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
      seats: "40 főig · éves számlázás",
      features: [
        "Minden Team funkció",
        "Több csapat kezelése egy szervezetben",
        "Org szerepkörök: admin, manager, member",
        "Tag- és csapatmeghívás jogosultság alapon",
        "Candidate flow manager jogosultsággal",
        "Szervezeti szintű összehasonlítás",
      ],
      ctaHref: "/sign-up",
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
      seats: "up to 40 members · annual billing",
      features: [
        "Everything in Team",
        "Multiple teams in one organization",
        "Org roles: admin, manager, member",
        "Member and team invitations by role",
        "Candidate flow with manager permissions",
        "Organization-level comparison",
      ],
      ctaHref: "/sign-up",
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

export function getPricingPlans(locale: Locale): PricingPlan[] {
  return pricingPlansData[locale] ?? pricingPlansData.hu;
}

export function getSelfPricingPlans(locale: Locale): SelfPricingPlan[] {
  return selfPricingPlansData[locale] ?? selfPricingPlansData.hu;
}

export function getTeamPricingPlans(locale: Locale): TeamPricingPlan[] {
  return teamPricingPlansData[locale] ?? teamPricingPlansData.hu;
}

export function getOrgPricingPlans(locale: Locale): OrgPricingPlan[] {
  return orgPricingPlansData[locale] ?? orgPricingPlansData.hu;
}

export function getPricingAddOns(locale: Locale): PricingAddOn[] {
  return pricingAddOnsData[locale] ?? pricingAddOnsData.hu;
}

export function getPricingDisplayPlans(locale: Locale): PricingDisplayPlan[] {
  return pricingDisplayPlansData[locale] ?? pricingDisplayPlansData.hu;
}

export function getPricingComparisonRows(locale: Locale): PricingComparisonRow[] {
  return pricingComparisonRowsData[locale] ?? pricingComparisonRowsData.hu;
}

export function getPricingFaqs(locale: Locale): PricingFaqItem[] {
  return pricingFaqsData[locale] ?? pricingFaqsData.hu;
}
