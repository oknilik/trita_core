import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FALLBACK_FX,
  formatFxDate,
  formatMoney,
  formatMoneyParts,
  moneyDisplay,
  parseEcbRates,
  parseMnbRates,
  toEur,
} from "@/lib/pricing/fx";

const plain = (value: string) => value.replace(/ /g, " ");

// Az MNB SOAP-válasz: a belső XML entitásokkal escape-elve ül a borítékban.
const MNB_SOAP = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetCurrentExchangeRatesResponse xmlns="http://www.mnb.hu/webservices/"><GetCurrentExchangeRatesResult>&lt;MNBCurrentExchangeRates&gt;&lt;Day date="2026-09-08"&gt;&lt;Rate unit="1" curr="AUD"&gt;231,45&lt;/Rate&gt;&lt;Rate unit="1" curr="EUR"&gt;395,12&lt;/Rate&gt;&lt;Rate unit="100" curr="JPY"&gt;229,67&lt;/Rate&gt;&lt;/Day&gt;&lt;/MNBCurrentExchangeRates&gt;</GetCurrentExchangeRatesResult></GetCurrentExchangeRatesResponse></soap:Body></soap:Envelope>`;

const ECB_XML = `<?xml version="1.0" encoding="UTF-8"?><gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time='2026-09-08'><Cube currency='USD' rate='1.1712'/><Cube currency='HUF' rate='394.85'/></Cube></Cube></gesmes:Envelope>`;

describe("parseMnbRates", () => {
  it("kiolvassa az EUR középárfolyamot és a napot az escape-elt SOAP-válaszból", () => {
    assert.deepEqual(parseMnbRates(MNB_SOAP), { hufPerEur: 395.12, date: "2026-09-08", source: "mnb" });
  });

  it("a nyers belső XML-t is elfogadja, és a unit-tal oszt", () => {
    const raw = `<MNBCurrentExchangeRates><Day date="2026-09-08"><Rate unit="100" curr="EUR">39512,00</Rate></Day></MNBCurrentExchangeRates>`;
    assert.deepEqual(parseMnbRates(raw), { hufPerEur: 395.12, date: "2026-09-08", source: "mnb" });
  });

  it("EUR nélkül vagy hibás számmal null", () => {
    assert.equal(parseMnbRates(`<MNBCurrentExchangeRates><Day date="2026-09-08"></Day></MNBCurrentExchangeRates>`), null);
    assert.equal(parseMnbRates("nem xml"), null);
  });
});

describe("parseEcbRates", () => {
  it("kiolvassa a HUF referencia-árfolyamot és a napot", () => {
    assert.deepEqual(parseEcbRates(ECB_XML), { hufPerEur: 394.85, date: "2026-09-08", source: "ecb" });
  });

  it("HUF nélkül null", () => {
    assert.equal(parseEcbRates(`<Cube time='2026-09-08'><Cube currency='USD' rate='1.17'/></Cube>`), null);
  });
});

describe("pénzformázás", () => {
  const fx = { hufPerEur: 400, date: "2026-09-08", source: "mnb" as const };

  it("egész euróra kerekít", () => {
    assert.equal(toEur(35_000, fx), 88);
    assert.equal(toEur(350_000, fx), 875);
    assert.equal(toEur(20_000, FALLBACK_FX), 50);
  });

  it("magyarul forint utána, angolul euró elé", () => {
    assert.equal(plain(formatMoney(35_000, "hu", fx)), "35 000 Ft");
    assert.equal(formatMoney(35_000, "en", fx), "€88");
    assert.equal(formatMoney(1_250_000, "en", fx), "€3,125");
    assert.deepEqual(formatMoneyParts(35_000, "en", fx), { amount: "88", currency: "€", currencyFirst: true });
  });

  it("a kiemelt ár: nagy szám + kis egység, a pénznem a lokál szerint", () => {
    const hu = moneyDisplay(35_000, "hu", fx, "/ fő + ÁFA");
    assert.equal(plain(hu.big), "35 000");
    assert.equal(hu.small, "Ft / fő + ÁFA");
    const en = moneyDisplay(35_000, "en", fx, "/ person + VAT");
    assert.equal(en.big, "€88");
    assert.equal(en.small, "/ person + VAT");
  });

  it("az árfolyam napja olvashatóan, üres dátumnál üres", () => {
    assert.equal(formatFxDate("2026-09-08", "en"), "8 Sept 2026");
    assert.equal(formatFxDate("", "en"), "");
  });
});
