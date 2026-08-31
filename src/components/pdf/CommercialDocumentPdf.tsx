import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { PdfWordmark } from "@/components/pdf/components/PdfWordmark";
import type { CommercialDocumentSnapshot } from "@/lib/crm/commercial-document-schema";
import { PDF_COLORS } from "@/lib/design-tokens";
import { COMPANY } from "@/lib/legal/company";
import { DISCOUNT_LABELS, QUOTE_STEP_LABELS } from "@/lib/quote/rate-card";

const c = {
  ink: PDF_COLORS.ink,
  body: PDF_COLORS.ink500,
  muted: PDF_COLORS.ink300,
  cream: PDF_COLORS.cream300,
  paper: PDF_COLORS.white,
  sand: PDF_COLORS.sand,
  green: PDF_COLORS.sage,
  orange: PDF_COLORS.bronze,
  yellow: PDF_COLORS.bronzeLight,
};

const s = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.canvas,
    color: c.ink,
    fontFamily: "DM Sans",
    fontSize: 9.5,
    lineHeight: 1.45,
    padding: "62 40 46 40",
  },
  header: {
    position: "absolute",
    left: 40,
    right: 40,
    top: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottom: `1 solid ${c.sand}`,
  },
  documentNo: { fontSize: 7.5, color: c.muted, letterSpacing: 0.3 },
  proposalPageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottom: `1 solid ${c.sand}`,
    marginBottom: 26,
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 52,
    top: 808,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTop: `1 solid ${c.sand}`,
    fontSize: 7,
    color: c.muted,
  },
  footerPage: { width: 60, textAlign: "right" },
  hero: {
    padding: "18 2 20 2",
    marginBottom: 4,
  },
  heroAccent: { width: 30, height: 3, borderRadius: 2, backgroundColor: c.orange, marginBottom: 14 },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: PDF_COLORS.bronzeDark,
    marginBottom: 9,
    fontWeight: 600,
  },
  title: {
    fontFamily: "Fraunces",
    fontSize: 27,
    lineHeight: 1.12,
    fontWeight: 600,
    marginBottom: 9,
    maxWidth: 450,
  },
  subtitle: { fontSize: 10.5, lineHeight: 1.5, color: c.body, maxWidth: 440 },
  preparedFor: { fontSize: 8, color: c.muted, marginTop: 12 },
  overview: {
    backgroundColor: PDF_COLORS.white,
    border: `1 solid ${c.sand}`,
    borderRadius: 12,
    flexDirection: "row",
    padding: "14 16",
    marginBottom: 13,
  },
  overviewItem: { flex: 1, paddingHorizontal: 10 },
  overviewDivider: { width: 1, backgroundColor: c.sand },
  overviewLabel: { fontSize: 7.5, color: c.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  overviewValue: { fontFamily: "Fraunces", fontSize: 15, color: c.ink, marginTop: 3 },
  section: {
    backgroundColor: PDF_COLORS.white,
    border: `1 solid ${c.sand}`,
    borderRadius: 9,
    padding: "14 16",
    marginBottom: 11,
  },
  sectionTitle: { fontFamily: "Fraunces", fontSize: 14, fontWeight: 600, marginBottom: 7, color: c.ink },
  subhead: { fontSize: 9.5, fontWeight: 600, marginTop: 7, marginBottom: 4 },
  paragraph: { color: c.body, marginBottom: 6 },
  note: { color: c.muted, fontSize: 8, marginTop: 4 },
  proposalSection: {
    backgroundColor: PDF_COLORS.white,
    border: `1 solid ${c.sand}`,
    borderRadius: 12,
    padding: "16 18",
    marginBottom: 13,
  },
  pricingSection: { padding: "0 2", marginBottom: 16 },
  sectionKicker: {
    color: PDF_COLORS.bronzeDark,
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  processRow: { flexDirection: "row", gap: 12, marginTop: 7 },
  processStep: { flex: 1 },
  processNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PDF_COLORS.sage100,
    color: c.green,
    fontSize: 8,
    fontWeight: 600,
    textAlign: "center",
    paddingTop: 4,
    marginBottom: 6,
  },
  processTitle: { fontSize: 9, fontWeight: 600, color: c.ink, marginBottom: 3 },
  processText: { fontSize: 8, lineHeight: 1.4, color: c.body },
  row: {
    flexDirection: "row",
    borderBottom: `0.6 solid ${c.sand}`,
    paddingVertical: 5,
  },
  rowLabel: { width: "38%", color: c.muted, paddingRight: 8 },
  rowValue: { width: "62%", color: c.ink, fontWeight: 500 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: c.cream,
    borderRadius: 7,
    padding: "6 7",
    fontSize: 7.5,
    color: c.muted,
    fontWeight: 700,
  },
  priceRow: {
    flexDirection: "row",
    padding: "6 7",
    borderBottom: `0.6 solid ${c.sand}`,
  },
  colWide: { width: "68%" },
  colAmount: { width: "32%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: PDF_COLORS.sage100,
    color: c.ink,
    borderRadius: 6,
    padding: "9 10",
    marginTop: 7,
    fontWeight: 700,
  },
  priceLead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 11,
  },
  priceLeadLabel: { color: c.muted, fontSize: 8 },
  priceLeadValue: { fontFamily: "Fraunces", fontSize: 23, color: c.green, fontWeight: 600 },
  nextStep: {
    backgroundColor: PDF_COLORS.sage100,
    borderRadius: 12,
    padding: "15 18",
    marginBottom: 10,
  },
  bullet: { flexDirection: "row", marginBottom: 4, color: c.body },
  bulletDot: { width: 12, color: c.orange },
  bulletText: { flex: 1 },
  twoCol: { flexDirection: "row", gap: 10 },
  half: { width: "50%" },
  signature: {
    marginTop: 28,
    flexDirection: "row",
    gap: 28,
  },
  signatureCell: {
    width: "50%",
    borderTop: `1 solid ${c.ink}`,
    paddingTop: 7,
    color: c.body,
  },
});

function huf(value: number): string {
  return `${Math.round(value).toLocaleString("hu-HU")} Ft`;
}

function date(value: string | null): string {
  if (!value) return "nincs megadva";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function durationLabel(start: string | null, end: string | null): string {
  if (!start || !end) return "90 napos program";
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "90 napos program";
  }
  const days = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000),
  );
  return `${days} napos program`;
}

function modeLabel(value: string): string {
  return value === "online" ? "online" : value === "hybrid" ? "hibrid" : "személyes";
}

function acceptanceLabel(value: string): string {
  if (value === "paper") return "papíralapú aláírás";
  if (value === "electronic") return "elektronikus aláírás";
  return "e-mailes elfogadás";
}

function ReferenceLabel({ value }: { value: string }) {
  return (
    <Text>
      {value === "named"
        ? "Nevesített referencia: cégnév és logó használata engedélyezett."
        : value === "anonymous"
          ? "Kizárólag nem azonosítható, anonim referencia engedélyezett."
          : "Referencia használata nem engedélyezett."}
    </Text>
  );
}

function Header({ snapshot }: { snapshot: CommercialDocumentSnapshot }) {
  return (
    <View fixed style={s.header}>
      <PdfWordmark size={17} />
      <Text style={s.documentNo}>{snapshot.documentNumber}</Text>
    </View>
  );
}

function Footer({ pageLabel }: { pageLabel?: string }) {
  return (
    <View fixed style={s.footer}>
      <Text>trita.io · {COMPANY.legalName}</Text>
      {pageLabel ? (
        <Text style={s.footerPage}>{pageLabel}</Text>
      ) : (
        <Text style={s.footerPage} render={({ pageNumber }) => `${pageNumber}. oldal`} />
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value || "nem alkalmazandó"}</Text>
    </View>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function PriceTable({ snapshot }: { snapshot: CommercialDocumentSnapshot }) {
  const { quote } = snapshot;
  return (
    <View>
      <View style={s.tableHeader}>
        <Text style={s.colWide}>Tétel</Text>
        <Text style={s.colAmount}>Nettó összeg</Text>
      </View>
      {quote.result.lines.map((line) => (
        <View key={line.key} style={s.priceRow} wrap={false}>
          <Text style={s.colWide}>{line.label}</Text>
          <Text style={s.colAmount}>{huf(line.amount)}</Text>
        </View>
      ))}
      {quote.result.discountAmount > 0 ? (
        <>
          <View style={s.priceRow}>
            <Text style={s.colWide}>Listaár</Text>
            <Text style={s.colAmount}>{huf(quote.result.listTotal)}</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={[s.colWide, { color: c.orange }]}>
              {quote.input.discountPct}% kedvezmény
              {quote.input.discountKind
                ? ` · ${DISCOUNT_LABELS[quote.input.discountKind]}`
                : ""}
            </Text>
            <Text style={[s.colAmount, { color: c.orange }]}>
              -{huf(quote.result.discountAmount)}
            </Text>
          </View>
        </>
      ) : null}
      <View style={s.totalRow}>
        <Text>Nettó összesen</Text>
        <Text>{huf(quote.result.netTotal)}</Text>
      </View>
      <View style={s.priceRow}>
        <Text style={s.colWide}>ÁFA</Text>
        <Text style={s.colAmount}>{quote.input.vatRate}% · {huf(quote.result.vatAmount)}</Text>
      </View>
      <View style={[s.totalRow, { backgroundColor: c.green, color: c.paper }]}>
        <Text>Bruttó összesen</Text>
        <Text>{huf(quote.result.grossTotal)}</Text>
      </View>
    </View>
  );
}

function Scope({ snapshot }: { snapshot: CommercialDocumentSnapshot }) {
  const { quote, customer } = snapshot;
  return (
    <>
      <Text style={s.subhead}>Mérési kör</Text>
      <Bullet>60 állításból álló egyéni önértékelés</Bullet>
      {quote.input.steps.map((step) => (
        <Bullet key={step}>{QUOTE_STEP_LABELS[step]}</Bullet>
      ))}
      <Text style={s.subhead}>Bevont csapatok</Text>
      {customer.teams.map((team, index) => (
        <Row
          key={`${team.name}-${index}`}
          label={`${index + 1}. ${team.name}`}
          value={`${team.headcount} fő · vezető: ${team.leader || "kijelölés alatt"} · ${
            team.waveKind === "baseline" ? "első mérési kör" : "visszamérés"
          }`}
        />
      ))}
      <Text style={s.note}>
        Összes tervezett résztvevő: {quote.input.headcount} fő. A létszám vagy a
        bevont csapatok változása írásbeli változáskezelésnek minősül, és
        szükség esetén módosítja a díjat és az ütemezést.
      </Text>
    </>
  );
}

function ProposalOverview({ snapshot }: { snapshot: CommercialDocumentSnapshot }) {
  const { quote, customer } = snapshot;
  return (
    <>
      <View style={s.hero}>
        <View style={s.heroAccent} />
        <Text style={s.eyebrow}>Team Scan · személyre szabott ajánlat</Text>
        <Text style={s.title}>Értsétek meg jobban a csapatotok működését.</Text>
        <Text style={s.subtitle}>
          Mérés, közös értelmezés és követhető következő lépések egyetlen,
          {" "}{durationLabel(customer.serviceStart, customer.serviceEnd).toLowerCase()} keretben.
        </Text>
        <Text style={s.preparedFor}>
          Készült: {customer.companyName} · {customer.representativeName}
        </Text>
      </View>

      <View style={s.overview} wrap={false}>
        <View style={s.overviewItem}>
          <Text style={s.overviewLabel}>Csapat</Text>
          <Text style={s.overviewValue}>{quote.input.teams} csapat</Text>
        </View>
        <View style={s.overviewDivider} />
        <View style={s.overviewItem}>
          <Text style={s.overviewLabel}>Résztvevők</Text>
          <Text style={s.overviewValue}>{quote.input.headcount} fő</Text>
        </View>
        <View style={s.overviewDivider} />
        <View style={s.overviewItem}>
          <Text style={s.overviewLabel}>Programkeret</Text>
          <Text style={s.overviewValue}>
            {durationLabel(customer.serviceStart, customer.serviceEnd)}
          </Text>
        </View>
      </View>

      <View style={s.proposalSection}>
        <Text style={s.sectionKicker}>Mit kap a csapat?</Text>
        <Text style={s.sectionTitle}>A teljes folyamat egyben</Text>
        <View style={s.twoCol}>
          <View style={s.half}>
            <Text style={s.subhead}>Mérés és csapatkép</Text>
            <Bullet>60 állításból álló egyéni önértékelés</Bullet>
            {quote.input.steps.map((step) => (
              <Bullet key={step}>{QUOTE_STEP_LABELS[step]}</Bullet>
            ))}
          </View>
          <View style={s.half}>
            <Text style={s.subhead}>Közös feldolgozás</Text>
            <Bullet>{`${customer.leaderDebriefMinutes} perces vezetői eredményfeldolgozás`}</Bullet>
            <Bullet>{`${quote.input.workshopDays} workshopnap · ${customer.workshopHoursPerDay} óra · ${modeLabel(customer.workshopMode)}`}</Bullet>
            <Bullet>{`${quote.input.waves} visszamérési hullám · ${quote.input.retainerMonths} hónap kísérés`}</Bullet>
          </View>
        </View>
        <View style={s.processRow}>
          <View style={s.processStep}>
            <Text style={s.processNumber}>1</Text>
            <Text style={s.processTitle}>Felmérjük</Text>
            <Text style={s.processText}>Láthatóvá tesszük az egyéni és közös működési mintákat.</Text>
          </View>
          <View style={s.processStep}>
            <Text style={s.processNumber}>2</Text>
            <Text style={s.processTitle}>Értelmezzük</Text>
            <Text style={s.processText}>A vezetővel és a csapattal együtt dolgozzuk fel az eredményeket.</Text>
          </View>
          <View style={s.processStep}>
            <Text style={s.processNumber}>3</Text>
            <Text style={s.processTitle}>Továbbvisszük</Text>
            <Text style={s.processText}>Konkrét fókuszokat és visszamérhető következő lépéseket rögzítünk.</Text>
          </View>
        </View>
        <Text style={s.note}>
          Bevont csapat: {customer.teams.map((team) => `${team.name} (${team.headcount} fő)`).join(", ")}.
        </Text>
      </View>
    </>
  );
}

function ProposalPricing({ snapshot }: { snapshot: CommercialDocumentSnapshot }) {
  const { quote, customer } = snapshot;
  return (
    <View>
      <View style={s.proposalPageHeader}>
        <PdfWordmark size={17} />
        <Text style={s.documentNo}>{snapshot.documentNumber}</Text>
      </View>
      <View style={s.pricingSection}>
        <Text style={s.sectionKicker}>Befektetés</Text>
        <View style={s.priceLead}>
          <View>
            <Text style={s.sectionTitle}>Programdíj</Text>
            <Text style={s.priceLeadLabel}>A teljes, fent részletezett program nettó díja</Text>
          </View>
          <Text style={s.priceLeadValue}>{huf(quote.result.netTotal)}</Text>
        </View>
        <PriceTable snapshot={snapshot} />
        <Text style={s.note}>
          Fizetési határidő: {customer.paymentDueDays} nap, banki átutalással.
        </Text>
      </View>

      <View style={s.nextStep}>
        <Text style={s.sectionKicker}>Következő lépés</Text>
        <Text style={s.sectionTitle}>Elfogadás után indulhat az egyeztetés</Text>
        <Text style={s.paragraph}>
          Az ajánlat {date(quote.validUntil)} napjáig érvényes. Elfogadása után
          elkészítjük az Egyedi Megrendelőlapot, majd közösen rögzítjük az indulás
          pontos időzítését és a résztvevői kört.
        </Text>
      </View>
    </View>
  );
}

function OrderForm({ snapshot }: { snapshot: CommercialDocumentSnapshot }) {
  const { quote, customer, legal } = snapshot;
  return (
    <>
      <View style={s.hero}>
        <Text style={s.eyebrow}>Team Scan</Text>
        <Text style={s.title}>Egyedi Megrendelőlap</Text>
        <Text style={s.subtitle}>
          Megrendelés azonosítója: {snapshot.documentNumber} · kiállítás:
          {" "}{date(snapshot.generatedAt)}
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>1. Szerződő felek</Text>
        <View style={s.twoCol}>
          <View style={s.half}>
            <Text style={s.subhead}>Szolgáltató</Text>
            <Row label="Név" value={COMPANY.legalName} />
            <Row label="Székhely" value={COMPANY.address} />
            <Row label="Cégjegyzékszám" value={COMPANY.registrationNumber} />
            <Row label="Adószám" value={COMPANY.taxNumber} />
            <Row label="Képviselő" value="A cégjegyzék szerinti képviselő" />
            <Row label="E-mail" value={COMPANY.contactEmail} />
          </View>
          <View style={s.half}>
            <Text style={s.subhead}>Megrendelő</Text>
            <Row label="Név" value={customer.companyName} />
            <Row label="Székhely" value={customer.registeredSeat} />
            <Row label="Nyilvántartási szám" value={customer.registrationNumber} />
            <Row label="Adószám" value={customer.taxNumber} />
            <Row label="Képviselő" value={`${customer.representativeName}${customer.representativeTitle ? `, ${customer.representativeTitle}` : ""}`} />
            <Row label="E-mail" value={customer.contactEmail} />
          </View>
        </View>
        <Text style={s.paragraph}>
          A Megrendelő kijelenti, hogy a szolgáltatást gazdasági vagy szakmai
          tevékenysége körében veszi igénybe, nem fogyasztóként jár el, és a
          nevében elfogadó vagy aláíró személy megfelelő képviseleti
          jogosultsággal rendelkezik.
        </Text>
        <Text style={s.subhead}>Számlázási adatok</Text>
        <Row label="Név és cím" value={`${customer.billingName || customer.companyName} · ${customer.billingAddress}`} />
        <Row label="Adószám" value={customer.billingTaxNumber || customer.taxNumber} />
        <Row label="Számlázási e-mail" value={customer.billingEmail || customer.contactEmail} />
        <Row label="PO-szám" value={customer.poNumber} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>2. A szerződés dokumentumai és létrejötte</Text>
        <Row label="B2B Szolgáltatási Feltételek" value={`${legal.b2bTermsVersion} · trita.io/legal/business-terms`} />
        <Row label="Adatfeldolgozási Megállapodás" value={`${legal.dpaVersion} · trita.io/legal/dpa`} />
        <Row label="Adatvédelmi tájékoztató" value={`${legal.privacyNoticeVersion} · trita.io/privacy`} />
        <Text style={s.paragraph}>
          A Megrendelő kijelenti, hogy a fenti dokumentumok változatlanul
          visszaidézhető példányát a szerződéskötést megelőzően megkapta,
          tartalmukat megismerte és elfogadja. Eltérés esetén jelen Egyedi
          Megrendelőlap, adatvédelmi tárgyban a DPA, majd a B2B Szolgáltatási
          Feltételek az irányadók.
        </Text>
        <Row label="Elfogadás módja" value={acceptanceLabel(customer.acceptanceMethod)} />
        <Text style={s.note}>
          E-mailes elfogadás esetén a szerződés akkor jön létre, amikor a
          képviseletre jogosult személy a dokumentumcsomag változtatás nélküli
          elfogadását a megjelölt címről a hello@trita.io címre megküldi.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>3. A szolgáltatás terjedelme</Text>
        <Scope snapshot={snapshot} />
        <Text style={s.subhead}>Alkalmak és szakmai közreműködés</Text>
        <Row label="Indító egyeztetés" value={`${customer.kickoffMinutes} perc · ${modeLabel(customer.workshopMode)}`} />
        <Row label="Vezetői eredményfeldolgozás" value={`${customer.leaderDebriefMinutes} perc`} />
        <Row label="Workshop" value={`${quote.input.workshopDays} nap · ${customer.workshopHoursPerDay} óra/nap · ${modeLabel(customer.workshopMode)}`} />
        <Row label="Kísérés / konzultáció" value={`${customer.consultingSessions} alkalom · ${customer.consultingMinutes} perc/alkalom`} />
        <Row label="Visszamérés" value={quote.input.waves > 0 ? `${quote.input.waves} kör` : "nem része"} />
        <Row label="Záró értékelés" value={`${customer.closingMinutes} perc`} />
        <Row label="Platform-hozzáférés vége" value={date(customer.platformAccessEnd)} />
        <Text style={s.note}>
          Kifejezetten nem része a szolgáltatásnak minden olyan mérés, csapat,
          riport, alkalom vagy közreműködés, amelyet ez a pont nem tartalmaz.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>4. Ütemezés és teljesítés</Text>
        <Row label="Tervezett kezdés" value={date(customer.serviceStart)} />
        <Row label="Tervezett zárás" value={date(customer.serviceEnd)} />
        <Text style={s.paragraph}>
          A Megrendelő késedelme, hiányos vagy késedelmes névsora, elmaradt
          közreműködése, illetve az egyeztetett időpont módosítása a kapcsolódó
          határidőket a késedelem és az észszerű újraszervezés idejével
          meghosszabbítja.
        </Text>
        <Text style={s.subhead}>Részvételi küszöb</Text>
        <Text style={s.paragraph}>
          Csapat- vagy szervezeti összesített eredmény legalább három válaszadó
          esetén jeleníthető meg. A küszöb elmaradása esetén a kampány egy
          alkalommal, legfeljebb öt munkanappal meghosszabbítható. Ha ezután sem
          teljesül, az érintett csapatra összesített riport nem készül; ez nem
          hibás teljesítés, ha a részvétel elmaradása nem a Szolgáltatónak
          felróható.
        </Text>
        <Text style={s.subhead}>Mérföldkő elfogadása</Text>
        <Text style={s.paragraph}>
          Objektíven azonosítható műszaki vagy szerződéses eltérést a
          Megrendelő az átadástól számított öt munkanapon belül írásban jelez.
          A mérési eredmény szakmai tartalmával való egyet nem értés önmagában
          nem minősül hibás teljesítésnek.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>5. Díjak és fizetés</Text>
        <Row
          label="A megrendelés jellege"
          value={quote.input.discountPct > 0 ? "kedvezményes" : "teljes díjú"}
        />
        <PriceTable snapshot={snapshot} />
        <Text style={s.subhead}>Fizetési ütemezés</Text>
        <Row label="Számlázási esemény" value={customer.paymentEvent} />
        <Row label="Nettó összeg" value={huf(quote.result.netTotal)} />
        <Row label="Fizetési határidő" value={`${customer.paymentDueDays} nap, banki átutalással`} />
        <Text style={s.paragraph}>
          A platformon online fizetés nem történik. Fizetési késedelem esetén a
          Ptk. szerinti vállalkozások közötti késedelmi kamat és a jogszabály
          szerinti behajtási költségátalány alkalmazható.
        </Text>
        <Text style={s.subhead}>Időpont-módosítás</Text>
        <Text style={s.paragraph}>
          Az egyeztetett élő alkalom egy alkalommal, legalább két munkanappal
          korábban díjmentesen áthelyezhető. Két munkanapon belüli lemondás vagy
          módosítás esetén az érintett alkalom díjának 50%-a számlázható,
          igazolt vis maior kivételével.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>6. Adatvédelem és indítási feltételek</Text>
        <Text style={s.paragraph}>
          A szervezeti mérés során a Megrendelő adatkezelő, a Szolgáltató
          adatfeldolgozó; az adatfeldolgozásra a {legal.dpaVersion} verziójú DPA
          irányadó. A kampány kizárólag a dokumentumcsomag elfogadása, a
          kapcsolattartó kijelölése, a résztvevői kör és az időzítés
          jóváhagyása, valamint a résztvevők megfelelő tájékoztatása után
          indítható.
        </Text>
        <Bullet>Egyedi válasz csapat- vagy szervezeti nézetben nem jelenik meg.</Bullet>
        <Bullet>Összesített eredmény kizárólag legalább három válaszadónál jelenik meg.</Bullet>
        <Bullet>A pszichológiai biztonság válaszai felhasználói azonosító nélkül kerülnek rögzítésre.</Bullet>
        <Bullet>A megjelenítési küszöb nem oldható fel, az egyedi válaszok nem fejthetők vissza.</Bullet>
        <Text style={s.paragraph}>
          Az eredmény nem használható felvételi, előléptetési, elbocsátási,
          fegyelmi vagy más jelentős döntés kizárólagos vagy meghatározó
          alapjául. A Team Scan nem pszichológiai diagnózis és nem alkalmassági
          vizsgálat.
        </Text>
        <Text style={s.subhead}>Kapcsolattartók</Text>
        <Row label="Megrendelő" value={`${customer.representativeName} · ${customer.contactEmail}`} />
        <Row label="Szolgáltató" value={`Cégjegyzék szerinti képviselő · ${COMPANY.contactEmail}${customer.providerPhone ? ` · ${customer.providerPhone}` : ""}`} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>7. Referencia és módszertani fejlesztés</Text>
        <ReferenceLabel value={customer.referencePermission} />
        <Text style={[s.paragraph, { marginTop: 6 }]}>
          {customer.researchPermission
            ? "A Megrendelő engedélyezi kizárólag vissza nem azonosítható, összesített adatok módszertani fejlesztési és kutatási célú felhasználását."
            : "A Megrendelő az összesített adatok módszertani és kutatási célú felhasználását nem engedélyezi."}
        </Text>
        <Text style={s.note}>
          Az engedély nem terjed ki személyes, álnevesített, üzleti titkot
          tartalmazó vagy a Megrendelőhöz, csapathoz, illetve résztvevőhöz
          észszerűen visszavezethető adatra.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>8. Egyedi feltételek és eltérések</Text>
        <Text style={s.paragraph}>{customer.specialTerms || "Nincs eltérés."}</Text>
      </View>

      <View style={s.section} wrap={false}>
        <Text style={s.sectionTitle}>9. Nyilatkozat és aláírások</Text>
        <Text style={s.paragraph}>
          A Felek kijelentik, hogy a jelen Egyedi Megrendelőlapot és
          mellékleteit elolvasták, megértették, és mint akaratukkal mindenben
          megegyezőt elfogadják.
        </Text>
        <View style={s.signature}>
          <View style={s.signatureCell}>
            <Text>{customer.representativeName}</Text>
            <Text>{customer.representativeTitle || "Megrendelő képviselője"}</Text>
            <Text>Kelt: ____________________</Text>
          </View>
          <View style={s.signatureCell}>
            <Text>A cégjegyzék szerinti képviselő</Text>
            <Text>{COMPANY.legalName}</Text>
            <Text>Kelt: ____________________</Text>
          </View>
        </View>
      </View>
    </>
  );
}

export function CommercialDocumentPdf({
  snapshot,
}: {
  snapshot: CommercialDocumentSnapshot;
}): ReactElement<DocumentProps> {
  const title = snapshot.kind === "PROPOSAL"
    ? "trita Team Scan ajánlat"
    : "trita Team Scan Egyedi Megrendelőlap";

  if (snapshot.kind === "PROPOSAL") {
    return (
      <Document title={title} author={COMPANY.legalName} subject={snapshot.documentNumber}>
        <Page size="A4" style={s.page}>
          <Header snapshot={snapshot} />
          <Footer pageLabel="1" />
          <ProposalOverview snapshot={snapshot} />
        </Page>
        <Page size="A4" style={s.page}>
          <Footer pageLabel="2" />
          <ProposalPricing snapshot={snapshot} />
        </Page>
      </Document>
    );
  }

  return (
    <Document
      title={title}
      author={COMPANY.legalName}
      subject={snapshot.documentNumber}
    >
      <Page size="A4" style={s.page} wrap>
        <Header snapshot={snapshot} />
        <Footer />
        <OrderForm snapshot={snapshot} />
      </Page>
    </Document>
  );
}
