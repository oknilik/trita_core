import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { getLanguageAlternates } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";
import { ContactForm } from "./ContactForm";

const pageCopy: Record<Locale, {
  title: string;
  subtitle: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  formTitle: string;
  formLead: string;
  infoTitle: string;
  infoBody: string;
  responseTitle: string;
  responseBody: string;
  legalTitle: string;
  legalBody: string;
}> = {
  hu: {
    title: "Kapcsolat",
    subtitle: "Írj nekünk, és 1 munkanapon belül válaszolunk.",
    eyebrow: "// kapcsolat",
    metaTitle: "Kapcsolat | trita",
    metaDescription: "Kapcsolatfelvétel a trita csapatával online űrlapon keresztül.",
    formTitle: "Miben segíthetünk?",
    formLead: "Nem nyílik levelezőapp. Itt, az oldalon tudsz írni nekünk.",
    infoTitle: "Mi történik beküldés után?",
    infoBody: "Az üzeneted közvetlenül a trita csapathoz érkezik. A válasz emailben jön a megadott címedre.",
    responseTitle: "Átlagos válaszidő",
    responseBody: "Munkanapokon jellemzően 24 órán belül.",
    legalTitle: "Adatkezelés",
    legalBody: "A megadott adatokat kizárólag az üzeneted megválaszolásához használjuk.",
  },
  en: {
    title: "Contact",
    subtitle: "Send us a message and we will reply within 1 business day.",
    eyebrow: "// contact",
    metaTitle: "Contact | trita",
    metaDescription: "Get in touch with the trita team via a built-in contact form.",
    formTitle: "How can we help?",
    formLead: "No email app opens. You can contact us directly here.",
    infoTitle: "What happens after submission?",
    infoBody: "Your message goes directly to the trita team. We reply to the email address you provide.",
    responseTitle: "Typical response time",
    responseBody: "Usually within 24 hours on business days.",
    legalTitle: "Data handling",
    legalBody: "We only use the submitted data to respond to your message.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const copy = pageCopy[locale] ?? pageCopy.hu;

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: "/contact",
      languages: getLanguageAlternates("/contact"),
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: "/contact",
      type: "website",
      siteName: "trita",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ContactPage() {
  const locale = await getServerLocale();
  const copy = pageCopy[locale] ?? pageCopy.hu;

  return (
    <main className="min-h-dvh bg-cream">
      <section className="border-b border-sand bg-ink px-6 py-14 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-dm-sans mb-4 text-[11px] uppercase tracking-[2px] text-bronze">
            {copy.eyebrow}
          </p>
          <h1 className="font-fraunces text-4xl leading-tight text-cream lg:text-[52px]">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-cream/75">
            {copy.subtitle}
          </p>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-16 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div className="rounded border border-sand bg-white p-5 md:p-7">
            <h2 className="font-fraunces text-3xl leading-tight text-ink">
              {copy.formTitle}
            </h2>
            <p className="mt-2 mb-6 text-[15px] leading-[1.75] text-ink-body">
              {copy.formLead}
            </p>
            <ContactForm locale={locale} />
          </div>

          <div className="space-y-4">
            <article className="rounded border border-sand bg-white p-5 md:p-6">
              <p className="font-dm-sans mb-3 text-[11px] uppercase tracking-[1px] text-bronze">
                01
              </p>
              <h3 className="font-fraunces text-2xl text-ink">{copy.infoTitle}</h3>
              <p className="mt-2 text-[15px] leading-[1.75] text-ink-body">{copy.infoBody}</p>
            </article>

            <article className="rounded border border-sand bg-white p-5 md:p-6">
              <p className="font-dm-sans mb-3 text-[11px] uppercase tracking-[1px] text-bronze">
                02
              </p>
              <h3 className="font-fraunces text-2xl text-ink">{copy.responseTitle}</h3>
              <p className="mt-2 text-[15px] leading-[1.75] text-ink-body">{copy.responseBody}</p>
            </article>

            <article className="rounded border border-sand bg-sage-soft p-5 md:p-6">
              <p className="font-dm-sans mb-3 text-[11px] uppercase tracking-[1px] text-bronze">
                03
              </p>
              <h3 className="font-fraunces text-2xl text-ink">{copy.legalTitle}</h3>
              <p className="mt-2 text-[15px] leading-[1.75] text-ink-body">{copy.legalBody}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
