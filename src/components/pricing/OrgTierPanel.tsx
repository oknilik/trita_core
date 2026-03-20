import type { Locale } from "@/lib/i18n";
import { TierCard } from "./TierCard";

const copy: Record<
  Locale,
  {
    intro: string;
    teamName: string;
    teamDesc: string;
    teamFeatures: string[];
    teamCta: string;
    orgName: string;
    orgDesc: string;
    orgFeatures: string[];
    orgBadge: string;
    orgCta: string;
    scaleName: string;
    scaleDesc: string;
    scaleFeatures: string[];
    scaleCta: string;
    trialNote: string;
  }
> = {
  hu: {
    intro: "Előfizetéses hozzáférés szervezeti szinten — havi vagy éves számlázással.",
    teamName: "Team",
    teamDesc: "Kis csapatoknak, gyors indulással.",
    teamFeatures: [
      "Self-assessment + observer visszajelzés",
      "Csapat dashboard és heatmap",
      "1 csapat kezelése",
      "Manager nézet és meghívások",
      "14 napos ingyenes próba",
    ],
    teamCta: "Kipróbálom · €49/hó",
    orgName: "Org",
    orgDesc: "Növekvő szervezeteknek, több csapattal.",
    orgFeatures: [
      "Minden Team funkció",
      "Korlátlan csapatok egy szervezetben",
      "Szervezeti szerepkörök (admin, manager, tag)",
      "Jogosultság alapú meghívások",
      "Candidate flow indítás",
    ],
    orgBadge: "Legnépszerűbb",
    orgCta: "Elindítom · €149/hó",
    scaleName: "Scale",
    scaleDesc: "Egyedi bevezetés nagyobb szervezeteknek.",
    scaleFeatures: [
      "Minden Org funkció",
      "Dedikált onboarding és rollout",
      "Priority support csatorna",
      "Egyedi szerződés és számlázás",
    ],
    scaleCta: "Kapcsolatfelvétel",
    trialNote: "Éves számlázásnál kedvezőbb havi díj. 14 napos próba kártyaadat nélkül.",
  },
  en: {
    intro: "Subscription access at the organizational level — billed monthly or annually.",
    teamName: "Team",
    teamDesc: "For small teams, quick to launch.",
    teamFeatures: [
      "Self-assessment + observer feedback",
      "Team dashboard and heatmap",
      "Manage 1 team",
      "Manager view and invitations",
      "14-day free trial",
    ],
    teamCta: "Try free · €49/mo",
    orgName: "Org",
    orgDesc: "For growing organizations with multiple teams.",
    orgFeatures: [
      "Everything in Team",
      "Unlimited teams in one organization",
      "Org roles (admin, manager, member)",
      "Role-based invitations",
      "Candidate flow",
    ],
    orgBadge: "Most popular",
    orgCta: "Get started · €149/mo",
    scaleName: "Scale",
    scaleDesc: "Custom rollout for larger organizations.",
    scaleFeatures: [
      "Everything in Org",
      "Dedicated onboarding and rollout",
      "Priority support channel",
      "Custom contract and billing",
    ],
    scaleCta: "Get in touch",
    trialNote:
      "Annual billing offers a lower monthly rate. 14-day trial, no card required.",
  },
};

export function OrgTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const c = copy[locale] ?? copy.hu;

  return (
    <div>
      <p className="mb-6 text-sm text-[#5a5650]">{c.intro}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <TierCard
          eyebrow={locale === "hu" ? "szervezet · előfizetés" : "organization · subscription"}
          name={c.teamName}
          price="€49"
          priceSub={locale === "hu" ? "/hó" : "/mo"}
          description={c.teamDesc}
          features={c.teamFeatures}
          ctaLabel={c.teamCta}
          ctaHref={isLoggedIn ? "/billing/checkout?plan=team_annual" : "/sign-up"}
          ctaVariant="outline"
        />
        <TierCard
          eyebrow={locale === "hu" ? "szervezet · előfizetés" : "organization · subscription"}
          name={c.orgName}
          badge={c.orgBadge}
          price="€149"
          priceSub={locale === "hu" ? "/hó" : "/mo"}
          description={c.orgDesc}
          features={c.orgFeatures}
          ctaLabel={c.orgCta}
          ctaHref={isLoggedIn ? "/billing/checkout?plan=org_annual" : "/sign-up"}
          ctaVariant="primary"
          highlighted
        />
        <TierCard
          eyebrow={locale === "hu" ? "szervezet · egyedi" : "organization · custom"}
          name={c.scaleName}
          price={locale === "hu" ? "Egyedi" : "Custom"}
          priceSub={locale === "hu" ? "ajánlat" : "quote"}
          description={c.scaleDesc}
          features={c.scaleFeatures}
          ctaLabel={c.scaleCta}
          ctaHref="/contact"
          ctaVariant="outline"
        />
      </div>
      <p className="mt-4 text-xs text-[#a09a90]">{c.trialNote}</p>
    </div>
  );
}
