import type { Locale } from "@/lib/i18n/core";

export type LegalDocumentSlug = "platform-terms" | "business-terms" | "dpa";

interface LocalizedText {
  hu: string;
  en: string;
}

export interface LegalReviewDocument {
  slug: LegalDocumentSlug;
  documentId: string;
  fileName: string;
  title: LocalizedText;
  shortTitle: LocalizedText;
  description: LocalizedText;
  scope: LocalizedText;
  highlights: Record<Locale, string[]>;
  reviewItems: Record<Locale, string[]>;
}

export const LEGAL_REVIEW_DOCUMENTS: readonly LegalReviewDocument[] = [
  {
    slug: "platform-terms",
    documentId: "PFF-2026-08-RD1",
    fileName: "trita-platform-felhasznalasi-feltetelek-review-draft-2026-08-28.docx",
    title: {
      hu: "Platform Felhasználási Feltételek",
      en: "Platform Terms of Use",
    },
    shortTitle: { hu: "Platformfeltételek", en: "Platform terms" },
    description: {
      hu: "A trita.io ingyenes egyéni személyiségfelmérésének, eredményeinek és observer-visszajelzéseinek tervezett használati feltételei.",
      en: "Draft terms for the free individual assessment, results and observer feedback available on trita.io. The Hungarian document is controlling; this English summary is informational only.",
    },
    scope: {
      hu: "Kizárólag az ingyenes egyéni szolgáltatás. A Team Scan és minden más B2B szolgáltatás külön ajánlat vagy szerződés tárgya.",
      en: "Free individual use only. Team Scan and all other B2B services require a separate offer or agreement.",
    },
    highlights: {
      hu: [
        "Az egyéni szolgáltatás díjmentes; nincs online fizetés vagy automatikus előfizetés.",
        "A Trita nem egészségügyi, klinikai vagy pszichológiai diagnosztikai eszköz.",
        "Az eredmény nem használható jelentős döntés kizárólagos alapjaként.",
        "A fiók bármikor törölhető; az adatkezelési részleteket az Adatvédelmi tájékoztató tartalmazza.",
      ],
      en: [
        "Individual use is free; there is no online payment or automatic subscription.",
        "Trita is not a medical, clinical or psychological diagnostic tool.",
        "Results must not be the sole basis of a decision with significant consequences.",
        "Accounts can be deleted at any time; data processing details are in the Privacy Notice.",
      ],
    },
    reviewItems: {
      hu: [
        "elfogadási pont, checkbox és verziónapló",
        "16+ vagy 18+ korhatár és képviselői hozzájárulás",
        "elektronikus archiválás módja",
        "Vercel tárhelyszolgáltató pontos jogi adatai",
        "fogyasztói vitarendezési adatok és a 373/2021. Korm. rendelet alkalmazása",
      ],
      en: [
        "acceptance point, checkbox and version log",
        "16+ or 18+ age threshold and guardian consent",
        "electronic archiving method",
        "exact legal details of the Vercel hosting entity",
        "consumer dispute information and application of Government Decree 373/2021",
      ],
    },
  },
  {
    slug: "business-terms",
    documentId: "B2B-2026-08-RD1",
    fileName: "trita-b2b-szolgaltatasi-feltetelek-review-draft-2026-08-28.docx",
    title: {
      hu: "B2B Szolgáltatási Feltételek",
      en: "B2B Service Terms",
    },
    shortTitle: { hu: "B2B feltételek", en: "B2B terms" },
    description: {
      hu: "A Team Scan és a kapcsolódó felmérési, riport-, workshop- és tanácsadási szolgáltatások szerződéses kerete.",
      en: "Draft contractual framework for Team Scan and related assessment, reporting, workshop and advisory services. The Hungarian document is controlling; this English summary is informational only.",
    },
    scope: {
      hu: "Csak akkor válik a szerződés részévé, ha az egyedi ajánlat, megrendelőlap vagy szerződés kifejezetten hivatkozik rá. Nincs online checkout.",
      en: "It becomes part of a contract only when an individual offer, order form or agreement expressly incorporates it. There is no online checkout.",
    },
    highlights: {
      hu: [
        "A konkrét scope-ot, díjat, időzítést és résztvevői kört mindig az Egyedi Dokumentum rögzíti.",
        "A Team Scan v1 rögzített mérési körre és dokumentált anonimitási minimumokra épül.",
        "A riportot tanácsadó validálja és publikálja; az egyéni válaszok nem jelennek meg csapatszinten.",
        "Adatfeldolgozási kérdésben a külön DPA az irányadó.",
      ],
      en: [
        "The individual document always defines scope, fees, timing and participant population.",
        "Team Scan v1 uses a fixed measurement scope and documented anonymity minimums.",
        "A consultant validates and publishes the report; individual answers are not shown at team level.",
        "The separate DPA controls data-processing matters.",
      ],
    },
    reviewItems: {
      hu: [
        "fizetési határidő, késedelmi kamat és lemondási szabályok",
        "felelősségi limit és biztosítási háttér",
        "SLA, támogatási idő és rendelkezésre állási vállalás",
        "referenciahasználat, alvállalkozók és változáskezelés",
        "egyedi adatmegőrzési és törlési vállalások összehangolása a DPA-val",
      ],
      en: [
        "payment term, late interest and cancellation rules",
        "liability cap and insurance coverage",
        "SLA, support hours and availability commitment",
        "reference use, subcontractors and change management",
        "alignment of retention and deletion commitments with the DPA",
      ],
    },
  },
  {
    slug: "dpa",
    documentId: "DPA-2026-08-RD1",
    fileName: "trita-adatfeldolgozasi-megallapodas-dpa-review-draft-2026-08-28.docx",
    title: {
      hu: "Adatfeldolgozási Megállapodás (DPA)",
      en: "Data Processing Agreement (DPA)",
    },
    shortTitle: { hu: "DPA", en: "DPA" },
    description: {
      hu: "A szervezeti szolgáltatások GDPR 28. cikke szerinti adatfeldolgozási kerete, mellékletekkel és alfeldolgozói listával.",
      en: "Draft Article 28 GDPR data-processing framework for organisational services, including schedules and a subprocessors list. The Hungarian document is controlling; this English summary is informational only.",
    },
    scope: {
      hu: "A B2B-szerződés elválaszthatatlan része. Adatfeldolgozási eltérésben elsőbbséget élvez a B2B Feltételekkel szemben.",
      en: "An integral part of the B2B agreement. It takes precedence over the B2B Terms for data-processing conflicts.",
    },
    highlights: {
      hu: [
        "Dokumentált utasítások, titoktartás, szerepkör-alapú hozzáférés és GDPR 32. cikk szerinti biztonság.",
        "Érintetti kérelmek, incidensek, DPIA és hatósági együttműködés támogatása.",
        "Alfeldolgozói értesítési és kifogási folyamat, valamint nemzetközi adattovábbítási garanciák.",
        "A megszűnés utáni visszaadás/törlés és a technikai-szervezési intézkedések mellékletei.",
      ],
      en: [
        "Documented instructions, confidentiality, role-based access and Article 32 GDPR security.",
        "Support for data-subject requests, incidents, DPIAs and regulatory cooperation.",
        "Subprocessor notification and objection process plus international-transfer safeguards.",
        "Post-termination return/deletion and schedules of technical and organisational measures.",
      ],
    },
    reviewItems: {
      hu: [
        "incidensértesítés vállalható maximuma",
        "új alfeldolgozó 15 vagy 30 napos értesítése",
        "Clerk, Neon, Vercel, Resend, Upstash és Anthropic pontos entitás-, régió- és transzferadatai",
        "törlési/backup határidők architekturális igazolása",
        "RTO/RPO, restore-teszt, sérülékenységvizsgálat és DPIA-sablon",
      ],
      en: [
        "achievable maximum incident-notification period",
        "15- or 30-day notice for new subprocessors",
        "exact entity, region and transfer details for Clerk, Neon, Vercel, Resend, Upstash and Anthropic",
        "architectural validation of deletion and backup periods",
        "RTO/RPO, restore testing, vulnerability scanning and a DPIA template",
      ],
    },
  },
] as const;

export function getLegalReviewDocument(slug: string): LegalReviewDocument | undefined {
  return LEGAL_REVIEW_DOCUMENTS.find((document) => document.slug === slug);
}

export function getLegalDocumentDownloadPath(document: LegalReviewDocument): string {
  return `/legal-documents/${document.fileName}`;
}
