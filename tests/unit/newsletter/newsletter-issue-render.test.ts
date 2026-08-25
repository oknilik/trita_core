import test from "node:test";
import assert from "node:assert/strict";
import { withCapturedSend } from "../../../scripts/email-samples";
import { blogImageUrl } from "@/lib/newsletter";
import { EMAIL_COLORS } from "@/lib/design-tokens";

// A küldő-modul induláskor kulcsot vár; a hálózatra nem megyünk ki, a
// `withCapturedSend` elkapja a kérést (ugyanaz a minta, mint a levél-mintáknál).
process.env.RESEND_API_KEY ??= "test-no-network";

// Dinamikus import a teszten BELÜL: a modul betöltése olvassa a kulcsot, a
// felső szintű await pedig nem megy át a futtató transzformációján.
const loadEmails = () => import("@/lib/emails");

// A szerkesztett szám az EGYETLEN sablon, amibe ember által írt szöveg kerül.
// A levél-HTML-t a sablon állítja elő, a szerkesztő nem írhat bele markupot —
// ezt őrzi ez a teszt, mert egy elszabaduló <script> vagy <a> a levélben
// ugyanolyan veszélyes, mint a weben.
test("a szerkesztoi bevezetot escape-eljuk, a bekezdes-tordelest ertelmezzuk", async () => {
  const { sendNewsletterIssueEmail } = await loadEmails();
  const payload = await withCapturedSend(() =>
    sendNewsletterIssueEmail({
      to: "olvaso@example.com",
      subject: "Teszt szám",
      intro: '<script>alert("xss")</script>\n\nMásodik bekezdés',
      items: [],
      unsubUrl: "https://trita.io/newsletter/unsubscribe?token=t",
      unsubPostUrl: "https://trita.io/api/newsletter/unsubscribe?token=t",
      locale: "hu",
      idempotencyKey: "test-issue-escape",
    }),
  );

  const html = payload.html ?? "";
  assert.ok(!html.includes("<script>"), "a nyers script-tag nem kerülhet a levélbe");
  assert.ok(html.includes("&lt;script&gt;"), "a szöveg escape-elve jelenik meg");
  assert.ok(html.includes("Második bekezdés"), "a második bekezdés megmarad");
});

// Tömeges levél: a leiratkozás egy kattintás, és a levelezőnek is látnia kell
// a fejlécből (RFC 8058) — e nélkül a Gmail/Yahoo bulk-szabályai büntetnek.
test("a szerkesztett szam viszi a leiratkozo linket a torzsben es a fejlecben", async () => {
  const unsubUrl = "https://trita.io/newsletter/unsubscribe?token=abc";
  const unsubPostUrl = "https://trita.io/api/newsletter/unsubscribe?token=abc";
  const { sendNewsletterIssueEmail } = await loadEmails();
  const payload = await withCapturedSend(() =>
    sendNewsletterIssueEmail({
      to: "olvaso@example.com",
      subject: "Teszt szám",
      intro: "Szia, ez a bevezető.",
      items: [
        {
          title: "Cikk",
          description: "Leírás",
          url: "https://trita.io/api/newsletter/click?d=1&to=cikk",
          imageUrl: blogImageUrl("https://trita.io", "cikk"),
          readingMinutes: 5,
        },
      ],
      unsubUrl,
      unsubPostUrl,
      locale: "hu",
      idempotencyKey: "test-issue-unsubscribe",
    }),
  );

  assert.ok((payload.html ?? "").includes(unsubUrl), "a láblécben ott a leiratkozó link");
  assert.ok((payload.text ?? "").includes(unsubUrl), "a sima szöveges változatban is");
  assert.ok(
    (payload.html ?? "").includes(blogImageUrl("https://trita.io", "cikk")),
    "a cikk képe bekerül",
  );
});

test("a szerkesztett szam mobilon nem ismetli a targyat es valodi kepkartyat keszit", async () => {
  const { renderNewsletterIssueEmail } = await loadEmails();
  const rendered = renderNewsletterIssueEmail({
    subject: "Az első trita éles hírlevél teszt",
    intro: "hello hello",
    items: [{
      title: "Toborzás helyett?",
      description: "Leírás",
      url: "https://trita.io/blog/cikk",
      imageUrl: blogImageUrl("https://trita.io", "cikk"),
      readingMinutes: 3,
    }],
    unsubUrl: "https://trita.io/newsletter/unsubscribe?token=t",
    locale: "hu",
  });

  assert.match(
    rendered.html,
    /<div class="em-mobile-hide"><h1 class="em-heading em-display"/,
    "a belső tárgycím csak mobilon legyen rejtve",
  );
  assert.match(rendered.html, /\.em-mobile-hide \{ display: none !important;/);
  assert.ok(rendered.html.includes('class="em-article-card"'), "külön cikk-kártya kell");
  assert.ok(
    rendered.html.includes(`background-color:${EMAIL_COLORS.surface}`),
    "a keret helyett meleg, kiemelt felület kell",
  );
  assert.ok(!rendered.html.includes(`padding:14px 16px;border:1px solid ${EMAIL_COLORS.border}`));
  assert.match(rendered.html, /<img[^>]+width="190" height="143"/);
});
