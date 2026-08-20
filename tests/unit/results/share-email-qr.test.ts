/**
 * Profil-megosztó email — QR-ág (a modal-beli QR-blokk kiváltása).
 *
 * A küldés maga Resend-et igényel, ezért itt a két olcsón ellenőrizhető
 * réteg fut: a sablon (inline cid-kép + magyarázat csak QR-melléklettel
 * kerül a levélbe) és a szerver-oldali QR-generálás best-effort helpere
 * (valódi PNG-t ad, hibán null-t — a küldést sosem buktatja).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildProfileShareHtml, profileShareUrl } from "@/lib/emails";
import { generateShareQrPng } from "@/lib/share-qr";

describe("buildProfileShareHtml — QR-blokk a levélben", () => {
  it("qrCid-del inline cid-kép és QR-magyarázat kerül a HTML-be (HU)", () => {
    const html = buildProfileShareHtml({
      locale: "hu",
      senderName: "Kata",
      token: "tok123",
      qrCid: "share-qr",
    });
    assert.ok(html.includes('src="cid:share-qr"'), "inline cid-kép hiányzik");
    assert.ok(html.includes("QR-kód a megosztott profilhoz"), "alt-szöveg hiányzik");
    assert.ok(
      html.includes("A QR-kódot telefonnal beolvasva a profil azonnal megnyílik."),
      "QR-magyarázat hiányzik",
    );
    // A CTA változatlanul a share URL-re mutat — a QR ugyanezt kódolja.
    assert.ok(html.includes(profileShareUrl("tok123")));
  });

  it("qrCid nélkül nincs cid-hivatkozás és QR-magyarázat (EN)", () => {
    const html = buildProfileShareHtml({
      locale: "en",
      senderName: "Kate",
      token: "tok123",
    });
    // A szójel és a formanyelvi jel MINDIG cid:-en megy (2026-08-19), ezért
    // itt a QR SAJÁT hivatkozását nézzük, nem a `cid:` puszta jelenlétét.
    assert.ok(!html.includes("cid:share-qr"), "QR nélkül nem lehet QR-cid");
    assert.ok(!html.includes("QR code"), "QR nélkül nem lehet QR-szöveg");
    assert.ok(html.includes(profileShareUrl("tok123")));
  });
});

describe("generateShareQrPng — best-effort szerver-oldali QR", () => {
  it("a share URL-ből valódi PNG-buffert ad", async () => {
    const png = await generateShareQrPng(profileShareUrl("tok123"));
    assert.ok(png, "PNG buffer kell");
    // PNG magic bytes — tényleg kép készült, nem üres/hibás buffer.
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  });

  it("hibás bemenetre null-t ad (a küldés QR nélkül megy tovább)", async () => {
    const png = await generateShareQrPng("");
    assert.equal(png, null);
  });
});
