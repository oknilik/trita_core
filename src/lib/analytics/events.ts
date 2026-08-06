import { z } from "zod";

/**
 * ESEMÉNY-KATALÓGUS — az analitika egyetlen forrása.
 *
 * MIÉRT ZÁRT KATALÓGUS: egy szabadon bővülő eseménystream két hónap alatt
 * zajjá válik (senki nem tudja, mit jelent a `button_clicked_2`), és
 * GDPR-oldalról sem indokolható, mert nem tudjuk megmondani, mit gyűjtünk.
 * Itt minden esemény deklarált, típusos és zod-dal validált; ami nincs a
 * katalógusban, azt a `/api/e` végpont ELDOBJA.
 *
 * MIÉRT `.strict()` MINDENHOL: ez az adatvédelmi garancia. Nem „vigyázunk,
 * hogy ne küldjünk PII-t" — a séma szerkezetileg nem engedi: az ismeretlen
 * kulcs validációs hiba. E-mail, név, szabad szöveg, kérdőív-válasz,
 * pontszám és token soha nem tud beszivárogni.
 *
 * MINDEN ESEMÉNYNEK VAN GAZDÁJA: a `question` mező a mérési terv
 * kérdés-azonosítója (docs/product/analytics-plan-2026-08.md, II. fejezet).
 * Új esemény csak akkor kerülhet be, ha meg tudod mondani, MELYIK kérdésre
 * válaszol. Ha nincs kérdés, nincs esemény.
 *
 * ORIGIN — ki küldheti:
 *   "client" — csak böngészőből (/api/e). Hamisítható, ezért üzleti
 *              igazságra nem alkalmas; mintázatra igen.
 *   "server" — csak szerver-oldali kódból (trackServerEvent). A /api/e
 *              végpont ELUTASÍTJA, még ha a kliens megpróbálná is.
 *   "both"   — mindkettő.
 *
 * Ld. még: docs/development/analytics.md
 */

/** Rövid, felsorolás-jellegű szöveges tulajdonság (nem szabad szöveg). */
const tag = (max = 64) => z.string().trim().min(1).max(max);

/** Nem-negatív egész (index, darabszám, időtartam). */
const count = z.number().int().nonnegative().max(1_000_000);

export type EventOrigin = "client" | "server" | "both";

export interface EventSpec {
  /** A tulajdonságok zárt sémája. `.strict()` KÖTELEZŐ. */
  schema: z.ZodObject<z.ZodRawShape, "strict">;
  origin: EventOrigin;
  /** Mit jelent az esemény — ez kerül az admin-felület tooltipjébe is. */
  description: string;
  /** Melyik mérési kérdésre válaszol (P1-P7 / A1-A7). */
  question: string;
}

const spec = (s: EventSpec): EventSpec => s;

// ─────────────────────────────────────────────────────────────────────
// PUBLIKUS (auth nélküli) események
// ─────────────────────────────────────────────────────────────────────

const publicEvents = {
  "page.view": spec({
    schema: z.object({}).strict(),
    origin: "client",
    description: "Oldalletöltés (normalizált útvonallal).",
    question: "P1",
  }),

  "landing.mode_switch": spec({
    schema: z
      .object({
        to: z.enum(["self", "team"]),
      })
      .strict(),
    origin: "client",
    description: "A landing egyéni/csapat mód-váltója.",
    question: "P2",
  }),

  "cta.click": spec({
    schema: z
      .object({
        // Beszélő azonosító, pl. "hero_primary", "pricing_team", "footer_contact"
        cta_id: tag(48),
        // Melyik felületen: "landing", "pricing", "pilot", "blog", "patterns"
        surface: tag(32),
        // Landing esetén a mód, hogy a két hero külön mérhető legyen
        mode: z.enum(["self", "team"]).optional(),
      })
      .strict(),
    origin: "client",
    description: "Elsődleges/másodlagos cselekvésre hívás kattintása.",
    question: "P2",
  }),

  "faq.open": spec({
    schema: z
      .object({
        faq_id: tag(48),
        surface: tag(32),
      })
      .strict(),
    origin: "client",
    description: "GYIK-tétel kinyitása — melyik a valódi vásárlói kétely.",
    question: "P4",
  }),

  "form.start": spec({
    schema: z.object({ form_id: tag(32) }).strict(),
    origin: "client",
    description: "Űrlap első érintése (fókusz vagy első karakter).",
    question: "P5",
  }),

  "form.submit": spec({
    schema: z
      .object({
        form_id: tag(32),
        outcome: z.enum(["success", "error"]),
      })
      .strict(),
    origin: "client",
    description: "Űrlap-beküldés kimenete (a tartalma NEM kerül ide).",
    question: "P5",
  }),

  "blog.read_progress": spec({
    schema: z
      .object({
        // A slug tartalom-azonosító, nem személyes adat
        slug: tag(120),
        milestone: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)]),
      })
      .strict(),
    origin: "client",
    description: "Cikk-olvasási mélység mérföldkövei.",
    question: "P6",
  }),

  "patterns.explore": spec({
    schema: z.object({ pattern_code: tag(8) }).strict(),
    origin: "client",
    description: "A csapatminta-felfedezőben megjelenített mintázat.",
    question: "P6",
  }),
} as const;

// ─────────────────────────────────────────────────────────────────────
// FELMÉRÉS-TÖLCSÉR (publikus /try és bejelentkezett /assessment)
// ─────────────────────────────────────────────────────────────────────

const assessmentEvents = {
  "assessment.start": spec({
    schema: z
      .object({
        // "guest" = /try (regisztráció nélkül), "user" = bejelentkezve
        mode: z.enum(["guest", "user"]),
      })
      .strict(),
    origin: "client",
    description: "A kitöltés első kérdésének megjelenése.",
    question: "P3",
  }),

  "assessment.question_view": spec({
    schema: z
      .object({
        mode: z.enum(["guest", "user"]),
        // 0-alapú kérdés-index — EZ adja a lemorzsolódás-görbét
        index: count,
      })
      .strict(),
    origin: "client",
    description: "Egy kérdés megjelenése — a lemorzsolódás-görbe forrása.",
    question: "P3 / A2",
  }),

  "assessment.abandon": spec({
    schema: z
      .object({
        mode: z.enum(["guest", "user"]),
        last_index: count,
      })
      .strict(),
    origin: "client",
    description: "Az oldal elhagyása befejezetlen kitöltéssel.",
    question: "P3 / A2",
  }),

  "assessment.complete": spec({
    schema: z
      .object({
        mode: z.enum(["guest", "user"]),
        duration_s: count.optional(),
      })
      .strict(),
    // A kitöltés TÉNYE szerver-oldali igazság (a /api/assessment/submit
    // sikerága írja); a kliens csak a duration_s-t tudná, de az sem ér annyit,
    // hogy hamisítható eseményt engedjünk be.
    origin: "server",
    description: "Sikeresen beküldött és kiértékelt felmérés.",
    question: "P3 / A1",
  }),
} as const;

// ─────────────────────────────────────────────────────────────────────
// SZERVER-OLDALI, ÜZLETILEG FONTOS események
// ─────────────────────────────────────────────────────────────────────

const serverEvents = {
  "auth.signup": spec({
    schema: z.object({}).strict(),
    origin: "server",
    description: "Új felhasználói profil létrejötte (Clerk webhook).",
    question: "P1 / A1",
  }),

  "inquiry.submit": spec({
    schema: z
      .object({
        // A téma zárt értékkészlet a kapcsolati űrlapról — nem szabad szöveg
        topic: tag(32),
        source: tag(32),
      })
      .strict(),
    origin: "server",
    description: "Beérkezett megkeresés (kapcsolati űrlap / pilot jelentkezés).",
    question: "P1 / P5",
  }),

  "observer.invite_created": spec({
    schema: z.object({ channel: z.enum(["email", "link"]) }).strict(),
    origin: "server",
    description: "Observer-meghívó létrehozása.",
    question: "A3",
  }),

  "observer.assessment_complete": spec({
    schema: z.object({}).strict(),
    origin: "server",
    description: "Beérkezett observer-visszajelzés.",
    question: "A3",
  }),

  "campaign.step_launch": spec({
    schema: z.object({ step_type: tag(32) }).strict(),
    origin: "server",
    description: "360°-os kampánylépés indítása.",
    question: "A7",
  }),
} as const;

// ─────────────────────────────────────────────────────────────────────
// BEJELENTKEZETT FELÜLET — használat
// ─────────────────────────────────────────────────────────────────────

const appEvents = {
  "surface.tab_view": spec({
    schema: z
      .object({
        // "results" | "team" | "org" | "manager" | "admin"
        surface: tag(32),
        tab: tag(32),
      })
      .strict(),
    origin: "client",
    description: "Fül-váltás a bejelentkezett felületeken — mit használnak.",
    question: "A4 / A5",
  }),

  "results.export": spec({
    schema: z.object({ format: z.enum(["pdf", "image", "link"]) }).strict(),
    origin: "client",
    description: "Riport exportálása vagy megosztása.",
    question: "A6",
  }),
} as const;

export const ANALYTICS_EVENTS = {
  ...publicEvents,
  ...assessmentEvents,
  ...serverEvents,
  ...appEvents,
} as const satisfies Record<string, EventSpec>;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

/** Egy esemény tulajdonság-objektumának típusa (a katalógusból származtatva). */
export type AnalyticsEventProps<N extends AnalyticsEventName> = z.input<
  (typeof ANALYTICS_EVENTS)[N]["schema"]
>;

export const ANALYTICS_EVENT_NAMES = Object.keys(ANALYTICS_EVENTS) as AnalyticsEventName[];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(ANALYTICS_EVENTS, value);
}

/** Elfogadható-e ez az esemény a megadott forrásból? */
export function acceptsOrigin(name: AnalyticsEventName, origin: "client" | "server"): boolean {
  const spec = ANALYTICS_EVENTS[name];
  return spec.origin === "both" || spec.origin === origin;
}

/**
 * Tulajdonságok validálása a katalógus szerint.
 *
 * A `.strict()` séma miatt az ismeretlen kulcs hiba — ez a PII-védelem
 * szerkezeti (nem fegyelmi) garanciája.
 */
export type EventPropValue = string | number | boolean;
/** Validált tulajdonság-objektum — a katalógus szerint CSAK skalárok. */
export type ValidatedEventProps = Record<string, EventPropValue>;

export function parseEventProps(
  name: AnalyticsEventName,
  props: unknown,
): { ok: true; props: ValidatedEventProps } | { ok: false; issue: string } {
  const result = ANALYTICS_EVENTS[name].schema.safeParse(props ?? {});
  if (!result.success) {
    return { ok: false, issue: result.error.issues.map((i) => `${i.path.join(".")}: ${i.code}`).join(", ") };
  }
  // A katalógus minden sémája `.strict()` és csak skalár mezőket deklarál,
  // ezért a szűkítés itt igaz állítás — a zod típusa csak nem tudja kimondani.
  return { ok: true, props: result.data as ValidatedEventProps };
}

/**
 * TILTOTT TULAJDONSÁG-NEVEK — a katalógus-teszt őrzi
 * (tests/unit/analytics/event-catalog.test.ts).
 *
 * Nem futásidejű szűrő: ha valaki ilyen nevű kulcsot venne fel a
 * katalógusba, a teszt bukik el a CI-ban, MIELŐTT bármi adat keletkezne.
 */
export const FORBIDDEN_PROP_NAMES = [
  "email",
  "e_mail",
  "name",
  "full_name",
  "username",
  "phone",
  "token",
  "invite_token",
  "password",
  "message",
  "text",
  "comment",
  "note",
  "answer",
  "answers",
  "score",
  "scores",
  "dimension",
  "user_id",
  "userid",
  "profile_id",
  "org_id",
  "organization",
  "team_name",
  "ip",
  "url",
  "referrer",
] as const;
