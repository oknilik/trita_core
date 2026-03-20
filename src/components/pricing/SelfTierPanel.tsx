import type { Locale } from "@/lib/i18n";
import { TierCard } from "./TierCard";

const copy: Record<
  Locale,
  {
    intro: string;
    freeName: string;
    freeDesc: string;
    freeFeatures: string[];
    freeCta: string;
    plusName: string;
    plusDesc: string;
    plusFeatures: string[];
    plusCta: string;
    reflectName: string;
    reflectDesc: string;
    reflectFeatures: string[];
    reflectCta: string;
  }
> = {
  hu: {
    intro: "Személyes fejlődéshez — facet szintű részletességgel, observer visszajelzéssel.",
    freeName: "Self Start",
    freeDesc: "Az alapok, ingyenesen.",
    freeFeatures: [
      "Személyiségteszt kitöltése",
      "Dimenzió szintű eredmények",
      "Max 2 observer meghívó",
      "Összefoglaló profil",
    ],
    freeCta: "Kezdem ingyen",
    plusName: "Self Plus",
    plusDesc: "Teljes profil facet szintig, munkastílus elemzéssel.",
    plusFeatures: [
      "Facet szintű részletes eredmények",
      "Munkastílus és fejlődési fókuszok",
      "Observer összehasonlítás",
      "PDF profil export",
    ],
    plusCta: "Megveszem · €49",
    reflectName: "Self Reflect",
    reflectDesc: "Observer meghívók és fejlődési check-in.",
    reflectFeatures: [
      "Minden Self Plus tartalom",
      "3 observer meghívó küldése",
      "Fejlődési check-in kérdőív",
      "Önkép vs. observer összehasonlítás",
    ],
    reflectCta: "Megveszem · €89",
  },
  en: {
    intro: "For personal development — facet-level depth, with observer feedback.",
    freeName: "Self Start",
    freeDesc: "The basics, for free.",
    freeFeatures: [
      "Complete a personality assessment",
      "Dimension-level results",
      "Up to 2 observer invitations",
      "Profile summary",
    ],
    freeCta: "Start for free",
    plusName: "Self Plus",
    plusDesc: "Full profile down to facet level, with work style analysis.",
    plusFeatures: [
      "Facet-level detailed results",
      "Work style and development focus areas",
      "Observer comparison",
      "PDF profile export",
    ],
    plusCta: "Buy · €49",
    reflectName: "Self Reflect",
    reflectDesc: "Observer invitations and a development check-in.",
    reflectFeatures: [
      "Everything in Self Plus",
      "Send 3 observer invitations",
      "Development check-in survey",
      "Self vs. observer comparison",
    ],
    reflectCta: "Buy · €89",
  },
};

export function SelfTierPanel({
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
          eyebrow={locale === "hu" ? "egyéni · ingyenes" : "individual · free"}
          name={c.freeName}
          price={locale === "hu" ? "Ingyenes" : "Free"}
          priceSub=""
          description={c.freeDesc}
          features={c.freeFeatures}
          ctaLabel={c.freeCta}
          ctaHref="/sign-up"
          ctaVariant="outline"
        />
        <TierCard
          eyebrow={locale === "hu" ? "egyéni · egyszeri" : "individual · one-time"}
          name={c.plusName}
          price="€49"
          priceSub={locale === "hu" ? "egyszeri" : "one-time"}
          description={c.plusDesc}
          features={c.plusFeatures}
          ctaLabel={c.plusCta}
          ctaHref={isLoggedIn ? "/profile" : "/sign-up"}
          ctaVariant="primary"
          highlighted
        />
        <TierCard
          eyebrow={locale === "hu" ? "egyéni · egyszeri" : "individual · one-time"}
          name={c.reflectName}
          price="€89"
          priceSub={locale === "hu" ? "egyszeri" : "one-time"}
          description={c.reflectDesc}
          features={c.reflectFeatures}
          ctaLabel={c.reflectCta}
          ctaHref={isLoggedIn ? "/profile" : "/sign-up"}
          ctaVariant="outline"
        />
      </div>
    </div>
  );
}
