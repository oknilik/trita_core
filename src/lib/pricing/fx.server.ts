import { FALLBACK_FX, parseEcbRates, parseMnbRates, type FxRate } from "@/lib/pricing/fx";

// Napi középárfolyam betöltése a szerver-oldali (marketing) oldalakhoz.
//
// Sorrend: MNB (a „napi középárfolyam" itthon ezt jelenti) → EKB
// referencia-árfolyam → rögzített tartalék. Fail-open: a marketing-oldal
// build-időben (nincs hálózat) és szolgáltatás-kiesésnél is renderelődjön;
// az oldalak ISR-esek (1 óra), így a hívás legfeljebb óránként fut, és a
// következő körben a napi árfolyam átveszi a tartalék helyét.

const MNB_URL = "https://www.mnb.hu/arfolyamok.asmx";
const MNB_ACTION = "http://www.mnb.hu/webservices/MNBArfolyamServiceSoap/GetCurrentExchangeRates";
const MNB_BODY =
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' +
  '<GetCurrentExchangeRates xmlns="http://www.mnb.hu/webservices/"/>' +
  "</soap:Body></soap:Envelope>";
const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const TIMEOUT_MS = 4000;

async function fetchMnb(): Promise<FxRate | null> {
  const response = await fetch(MNB_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"${MNB_ACTION}"` },
    body: MNB_BODY,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return parseMnbRates(await response.text());
}

async function fetchEcb(): Promise<FxRate | null> {
  const response = await fetch(ECB_URL, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!response.ok) return null;
  return parseEcbRates(await response.text());
}

export async function loadFxRate(): Promise<FxRate> {
  for (const source of [fetchMnb, fetchEcb]) {
    try {
      const rate = await source();
      if (rate) return rate;
    } catch {
      // A következő forrásra lépünk; a végén a tartalék-árfolyam marad.
    }
  }
  return FALLBACK_FX;
}
