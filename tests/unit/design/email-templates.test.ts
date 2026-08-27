/**
 * Levél-guardrail (2026-08-19 arculati átállás).
 *
 * A levél-réteg azért tudott több design-körön át változatlan maradni, mert
 * semmi nem őrizte. Ez a készlet MINDEN kimenő sablont leellenőriz, mindkét
 * nyelven, a valódi küldő-útról (`scripts/email-samples.ts`) — ugyanabból a
 * listából, amit az előnézet-generátor is renderel.
 *
 * Amit őriz:
 *   1. szerkezet — eyebrow + Fraunces címsor + preheader MINDEN sablonon;
 *   2. kontraszt — az akciógombok felirata számolt AA-t teljesít;
 *   3. tokenek — a levél-modulokban nincs nyers hex;
 *   4. skála — a levélben csak a dokumentált fokok fordulnak elő;
 *   5. arculat — kanonikus szójel, és a kivezetett elemek nem térnek vissza;
 *   6. család — formanyelvi jel csak az ügyfél-levélen;
 *   7. aláírás — egyetlen kanonikus alak, egyetlen dokumentált kivétellel;
 *   8. leiratkozás — minden életciklus-levél láblécében ott a link;
 *   9. képek — minden `cid:` hivatkozáshoz tartozik inline csatolmány;
 *  10. nyelv — locale nélkül hívva MAGYARUL megy ki.
 *
 * A 9. és a 10. két ÉLES hibára válasz (2026-08-19): a képek hosztolt URL-en
 * mentek és nem töltődtek be, a magyar felhasználók pedig angol levelet kaptak.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EMAIL_COLORS } from "@/lib/design-tokens";
import { EMAIL_ART } from "@/lib/email-art";
import { renderEmailSamples, withCapturedSend, type EmailSample } from "../../../scripts/email-samples";

/**
 * A minták renderelése egyszer fut, és a tesztek `await`-elik. Nem
 * modul-szintű await: a unit-réteg CJS-re fordít, ott az nem támogatott.
 */
const samplesPromise: Promise<EmailSample[]> = renderEmailSamples();

/** Minden sablon mindkét nyelven — az admin-értesítő szándékosan csak magyarul. */
const HU_ONLY = new Set(["hiring_credits_request"]);

/**
 * Életciklus-levelek: a felhasználó kikapcsolhatja őket, tehát a láblécben
 * KÖTELEZŐ a leiratkozó-link. A működési levelek (kód, meghívó, eredmény) nem
 * tartoznak ide — azokról nem a platform, hanem a szervezet vagy a másik fél
 * dönt (ld. az `/email-preferences` ígéretét).
 */
const LIFECYCLE = new Set(["welcome", "reflection_prompt", "draft_reminder"]);

/** A dokumentált személyes aláírás — ld. `PERSONAL_SIGN_OFF` az emails.ts-ben. */
const PERSONAL_SIGN_OFF_TEMPLATES = new Set([
  "pilot_apply_confirmation",
  "advisory_confirmation",
]);

// ─── Kontraszt-számítás (WCAG 2.1 relatív luminancia) ────────────────────────

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ─── 1. Szerkezet ────────────────────────────────────────────────────────────

test("minden sablon ad eyebrow-t, Fraunces címsort és preheadert", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    const label = `${s.id} (${s.locale})`;
    assert.match(s.html, /<h1 class="em-heading em-display"/, `${label}: nincs címsor`);
    assert.match(s.html, /class="em-eyebrow"/, `${label}: nincs eyebrow`);
    assert.match(
      s.html,
      /<div style="display:none!important;visibility:hidden/,
      `${label}: nincs rejtett preheader`,
    );

    // A címsor és az eyebrow ne legyen üres – a típus megköveteli a mezőt,
    // de üres stringgel is átmenne.
    const heading = s.html.match(/<h1 class="em-heading em-display"[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    assert.ok(heading && heading.trim().length > 2, `${label}: üres címsor`);
    const eyebrow = s.html.match(/class="em-eyebrow"[^>]*>([^<]*)</)?.[1];
    assert.ok(eyebrow && eyebrow.trim().length > 2, `${label}: üres eyebrow`);
  }
});

test("minden sablon mindkét nyelven renderel", async () => {
  const samples = await samplesPromise;
  const byId = new Map<string, Set<string>>();
  for (const s of samples) {
    byId.set(s.id, (byId.get(s.id) ?? new Set()).add(s.locale));
  }
  for (const [id, locales] of byId) {
    const expected = HU_ONLY.has(id) ? ["hu"] : ["en", "hu"];
    assert.deepEqual([...locales].sort(), expected, `${id}: hiányzó nyelv`);
  }
  assert.ok(byId.size >= 19, `kevés sablon a listában (${byId.size})`);
});

// ─── 2. Kontraszt ────────────────────────────────────────────────────────────

test("az akciógombok felirata teljesíti az AA-t (4,5:1)", () => {
  const primary = contrast(EMAIL_COLORS.actionPrimaryBg, EMAIL_COLORS.actionPrimaryFg);
  const secondary = contrast(EMAIL_COLORS.actionSecondaryBg, EMAIL_COLORS.actionSecondaryFg);
  assert.ok(primary >= 4.5, `elsődleges gomb: ${primary.toFixed(2)}:1`);
  assert.ok(secondary >= 4.5, `másodlagos gomb: ${secondary.toFixed(2)}:1`);
});

test("a szöveg-szerepek olvashatók a vásznon ÉS a kártyán is", () => {
  // A lábléc a KRÉM vásznon ül, a törzs a FEHÉR kártyán – a halk szerepnek
  // mindkettőn át kell mennie. A korábbi `mutedWarm` fehéren 4,40:1-et adott.
  for (const surface of [EMAIL_COLORS.canvas, EMAIL_COLORS.card] as const) {
    for (const [role, color] of [
      ["heading", EMAIL_COLORS.heading],
      ["body", EMAIL_COLORS.body],
      ["muted", EMAIL_COLORS.muted],
    ] as const) {
      const ratio = contrast(surface, color);
      assert.ok(ratio >= 4.5, `${role} a ${surface} felületen: ${ratio.toFixed(2)}:1`);
    }
  }
  // Az eyebrow a fehér kártyán ül – a brand-bronz itt megbukna, ezért van
  // külön `accentText` szerep.
  const eyebrow = contrast(EMAIL_COLORS.card, EMAIL_COLORS.accentText);
  assert.ok(eyebrow >= 4.5, `eyebrow a kártyán: ${eyebrow.toFixed(2)}:1`);
});

// ─── 3. Tokenek ──────────────────────────────────────────────────────────────

test("a levél-modulokban nincs nyers hex – minden szín a design-tokens.ts-ből jön", () => {
  for (const file of ["src/lib/email-layout.ts", "src/lib/emails.ts"]) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    const hexes = source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    assert.deepEqual(hexes, [], `${file}: nyers hex (${hexes.join(", ")})`);
  }
});

test("a renderelt levélben csak EMAIL_COLORS-értékek szerepelnek színként", async () => {
  const samples = await samplesPromise;
  const allowed = new Set(Object.values(EMAIL_COLORS).map((c) => c.toLowerCase()));
  for (const s of samples) {
    for (const hex of s.html.match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
      assert.ok(
        allowed.has(hex.toLowerCase()),
        `${s.id} (${s.locale}): ismeretlen szín ${hex} – vedd fel EMAIL_COLORS szerepként`,
      );
    }
  }
});

// ─── 4. Skála ────────────────────────────────────────────────────────────────

/**
 * A levél dokumentált fok-létrája. A 16px törzs a médium kivétele (ld.
 * `EMAIL_P`); a 34 a kód-doboz, a 26 a címsor, a 11 az eyebrow.
 * A `5px` (eyebrow-pötty cellája) és az `1px` (rejtett preheader) NEM szöveg.
 */
const TYPE_LADDER = new Set([34, 26, 16, 14, 13, 12, 11]);
const NON_TEXT_SIZES = new Set([5, 1]);

test("a levél a dokumentált fok-létrán marad", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    for (const match of s.html.match(/font-size:(\d+)px/g) ?? []) {
      const px = Number(match.split(":")[1].replace("px", ""));
      assert.ok(
        TYPE_LADDER.has(px) || NON_TEXT_SIZES.has(px),
        `${s.id} (${s.locale}): ${px}px nincs a levél-létrán`,
      );
    }
  }
});

test("az eyebrow a text-label receptjét viszi (0,14em + 700)", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    const eyebrow = s.html.match(/class="em-eyebrow"[^>]*style="([^"]*)"/)?.[1] ?? "";
    assert.match(eyebrow, /letter-spacing:0\.14em/, `${s.id} (${s.locale}): rossz betűköz`);
    assert.match(eyebrow, /text-transform:uppercase/, `${s.id} (${s.locale}): nem verzál`);
  }
});

// ─── 5. Arculat ──────────────────────────────────────────────────────────────

test("a kanonikus szójel megy ki, a kivezetett elemek nem térnek vissza", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    const label = `${s.id} (${s.locale})`;
    assert.ok(
      s.html.includes(`cid:${EMAIL_ART.wordmark.cid}`),
      `${label}: nincs kanonikus szójel`,
    );
    assert.match(s.html, /alt="trita"/, `${label}: a szójelnek alt-szöveg kell (kikapcsolt kép)`);
    // A háromszínű szójel a homok plaketten – 2026-08-19-én kivezetve.
    assert.ok(!s.html.includes(">rit<"), `${label}: visszatért a háromszínű szójel`);
    // A bronz CTA (fehér felirattal 3,28:1) – kivezetve.
    assert.ok(
      !s.html.includes(`background-color:${EMAIL_COLORS.accent};border-radius:12px`),
      `${label}: az elsődleges gomb nem lehet bronz`,
    );
  }
});

test("a kártya és a gomb a rendszer sarok-létráján ül (20 / 12)", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    assert.match(s.html, /class="em-card"[\s\S]{0,200}?border-radius:20px/, `${s.id}: kártya ≠ 20px`);
    // A kód-levélben nincs gomb (a kód maga a tartalom), ezért feltételes.
    if (s.html.includes('class="em-cta"')) {
      assert.match(s.html, /class="em-cta"[\s\S]{0,200}?border-radius:12px/, `${s.id}: gomb ≠ 12px`);
    }
  }
});

test("a webfont-réteg mso-feltételes (az Outlook különben Times-ra esik)", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    assert.match(
      s.html,
      /<!--\[if !mso\]><!-->\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com/,
      `${s.id}: a webfont-link nincs mso-feltételes blokkban`,
    );
  }
});

// ─── 6. Formanyelvi jel ──────────────────────────────────────────────────────

// 2026-08-20: korábban a jel csak az „ügyfél" családon volt ott, a kód- és
// magic-link-levélen nem. Ez a felületen egyenetlenségként jelentkezett, ezért
// a család-fogalom kivezetve. Ez a teszt KIVÉTEL NÉLKÜL kéri a jelet – ha
// bárki visszavezetne egy feltételt, itt bukik.
test("formanyelvi jel MINDEN levélen ott van, és dekorációként", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    assert.ok(
      s.html.includes(`cid:${EMAIL_ART.mark.cid}`),
      `${s.id} (${s.locale}): hiányzik a formanyelvi jel`,
    );
    // 3. szintű jel: nem állít mérési tartalmat, tehát a képernyőolvasónak
    // nincs mondanivalója.
    assert.match(s.html, /alt="" role="presentation"/, `${s.id}: a jel nem dekorációként megy`);
  }
});

// ─── 7. Aláírás ──────────────────────────────────────────────────────────────

test("egyetlen kanonikus aláírás, egyetlen dokumentált kivétellel", async () => {
  const samples = await samplesPromise;
  const canonical: Record<string, string> = { hu: "a trita csapata", en: "the trita team" };
  for (const s of samples) {
    const signOff = s.html.match(/<strong style="color:[^"]*">([^<]*)<\/strong>\s*<\/p>/)?.[1];
    assert.ok(signOff, `${s.id} (${s.locale}): nincs aláírás`);
    const expected = PERSONAL_SIGN_OFF_TEMPLATES.has(s.id)
      ? "Leinad · trita"
      : canonical[s.locale];
    assert.equal(signOff, expected, `${s.id} (${s.locale}): eltérő aláírás`);
  }
});

// ─── 8. Leiratkozás ──────────────────────────────────────────────────────────

test("minden életciklus-levél láblécében ott a leiratkozó-link", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    const hasOptOut = s.html.includes("/email-preferences");
    assert.equal(
      hasOptOut,
      LIFECYCLE.has(s.id),
      `${s.id} (${s.locale}): ${LIFECYCLE.has(s.id) ? "hiányzik" : "fölösleges"} a leiratkozó-link`,
    );
    if (hasOptOut) {
      // Linkként, nem nyers URL-ként a törzsben (2026-08-19 előtti minta).
      assert.match(
        s.html,
        /class="em-foot-link"[^>]*>(Levélbeállítások|Email preferences)</,
        `${s.id}: a leiratkozás nem a lábléc-slotban van`,
      );
    }
  }
});

// ─── 9. Képek: a levél MAGÁVAL VISZI őket ────────────────────────────────────

test("minden cid-hivatkozáshoz tartozik inline csatolmány (és fordítva)", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    const referenced = new Set(
      [...s.html.matchAll(/src="cid:([^"]+)"/g)].map((m) => m[1]),
    );
    const attached = new Set(
      s.attachments.map((a) => a.content_id).filter((id): id is string => Boolean(id)),
    );

    for (const cid of referenced) {
      assert.ok(attached.has(cid), `${s.id} (${s.locale}): a "${cid}" képhez nincs csatolmány`);
    }
    for (const cid of attached) {
      assert.ok(referenced.has(cid), `${s.id} (${s.locale}): a "${cid}" csatolmányra semmi nem hivatkozik`);
    }
    assert.ok(referenced.size > 0, `${s.id} (${s.locale}): egyetlen kép sincs a levélben`);

    // A bájtok tényleg ott vannak, nem csak a fejléc.
    for (const a of s.attachments) {
      // 50 base64-karakter alatt már a PNG-fejléc sem férne el. (A megosztó
      // levél mintája szándékosan 1×1-es kép, ezért nem a méret a küszöb.)
      assert.ok((a.content?.length ?? 0) > 50, `${s.id}: üres csatolmány (${a.content_id})`);
      assert.equal(a.content_type, "image/png", `${s.id}: nem PNG csatolmány (${a.content_id})`);
    }
  }
});

test("külső kép csak a hírlevél trita.io-s cikkborítója lehet", async () => {
  const samples = await samplesPromise;
  const imageTemplates = new Set(["newsletter_blog_post", "newsletter_issue"]);
  for (const s of samples) {
    const external = [...s.html.matchAll(/<img[^>]+src="((?!cid:)[^"]*)"/g)].map((m) => m[1]);
    if (!imageTemplates.has(s.id)) {
      assert.deepEqual(
        external,
        [],
        `${s.id} (${s.locale}): nem engedélyezett külső képforrás (${external.join(", ")})`,
      );
      continue;
    }

    assert.ok(external.length > 0, `${s.id} (${s.locale}): hiányzik a cikkborító`);
    for (const src of external) {
      const url = new URL(src);
      assert.equal(url.protocol, "https:", `${s.id}: a cikkborító nem HTTPS`);
      assert.equal(url.hostname, "trita.io", `${s.id}: idegen kép-host (${url.hostname})`);
      // STABIL route kell, nem a blog metadata-image útja: azt a Next
      // build-generált utótaggal szolgálja ki (`…/opengraph-image-<hash>`),
      // az utótag nélküli alak pedig 404 – a levélben törött kép lenne belőle
      // (2026-08-21, mérve prod buildon).
      assert.match(
        url.pathname,
        /^\/api\/newsletter\/cover\/[a-z0-9-]+$/,
        `${s.id}: a cikkborító nem a stabil hírlevél-route-ról jön (${url.pathname})`,
      );
      assert.doesNotMatch(
        url.pathname,
        /opengraph-image/,
        `${s.id}: a metadata-image route build-hashelt, levélben 404-et ad`,
      );
    }
  }
});

test("a hírlevél látható leiratkozása megerősítő oldal, a fejlécé RFC 8058 POST", async () => {
  const samples = await samplesPromise;
  for (const s of samples.filter((sample) =>
    ["newsletter_blog_post", "newsletter_issue"].includes(sample.id))) {
    assert.match(s.html, /\/newsletter\/unsubscribe\?token=/, `${s.id}: nincs látható leiratkozás`);
    assert.equal(
      s.headers["List-Unsubscribe"],
      "<https://trita.io/api/newsletter/unsubscribe?token=unsub-token>",
      `${s.id}: rossz List-Unsubscribe cél`,
    );
    assert.equal(s.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  }
});

// ─── 10. Nyelv ───────────────────────────────────────────────────────────────

test("locale nélkül hívva magyarul megy ki a levél", async () => {
  // A 2026-08-19-i hiba: a küldők egy része `?? "en"`-re esett, egy másik
  // része a címzett e-mail-TLD-jéből tippelt (`gmail.com` → angol). Az
  // alapértelmezés mostantól a DEFAULT_LOCALE.
  const emails = await import("@/lib/emails");

  const welcome = await withCapturedSend(() =>
    emails.sendWelcomeEmail({ to: "valaki@gmail.com" }),
  );
  assert.match(String(welcome.subject), /Üdvözlünk/, "a welcome levél nem magyarul ment");
  assert.match(String(welcome.html), /lang="hu"/, "a welcome levél nyelvi jelölése nem hu");

  const code = await withCapturedSend(() =>
    emails.sendVerificationCodeEmail({ to: "valaki@gmail.com", code: "123456" }),
  );
  assert.match(String(code.subject), /kódod/, "a kód-levél nem magyarul ment");

  const invite = await withCapturedSend(() =>
    emails.sendTeamInviteEmail({
      to: "valaki@gmail.com",
      teamName: "Kék csapat",
      signUpUrl: "https://trita.io/join/x",
    }),
  );
  assert.equal(invite.subject, "Csapatmeghívó: Kék csapat – trita");
  assert.match(String(invite.html), /Meghívást kaptál: Kék csapat/);
  assert.doesNotMatch(String(invite.html), /Kék csapat csapatba/);
});

test("a küldő-modulban nincs angolra eső alapértelmezés", () => {
  // Kommentek nélkül: a modul fejléce SZÁNDÉKOSAN idézi a kivezetett mintát.
  const source = readFileSync(join(process.cwd(), "src/lib/emails.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.ok(
    !/\?\?\s*"en"/.test(source),
    'emails.ts: `?? "en"` alapértelmezés – a feloldás a normalizeLocale dolga',
  );
  assert.ok(
    !source.includes("endsWith(\".hu\")"),
    "emails.ts: a levélcím TLD-je nem nyelvi jelzés – a heurisztika kivezetve",
  );
});

// ─── Sima szöveges változat ──────────────────────────────────────────────────

test("minden levélnek van sima szöveges változata is", async () => {
  const samples = await samplesPromise;
  for (const s of samples) {
    assert.ok(s.text.trim().length > 40, `${s.id} (${s.locale}): üres/rövid text/plain`);
    assert.ok(!s.text.includes("<"), `${s.id} (${s.locale}): HTML szivárgott a text/plain-be`);
  }
});
