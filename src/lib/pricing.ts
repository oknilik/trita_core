import type { Locale } from "@/lib/i18n";

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

export function getPricingPlans(locale: Locale): PricingPlan[] {
  return pricingPlansData[locale] ?? pricingPlansData.hu;
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
