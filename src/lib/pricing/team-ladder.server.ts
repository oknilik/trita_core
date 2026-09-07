import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { loadRateCard } from "@/lib/quote/rate-card.server";
import { derivePublicLadder, type PublicLadder } from "@/lib/pricing/team-ladder";

// A publikus árlétra betöltése a szerver-oldali (marketing) oldalakhoz.
//
// Fail-open az ALAPÉRTELMEZETT kártyára: a marketing-oldal build-időben
// (dummy env, nincs DB) és DB-kiesésnél is renderelődjön, a beépített
// számokkal. A mentett kártya a következő ISR-körben (vagy az admin
// mentéskor kiváltott revalidálással) átveszi a helyét.

export async function loadPublicLadder(): Promise<PublicLadder> {
  try {
    const { rate } = await loadRateCard();
    return derivePublicLadder(rate);
  } catch {
    return derivePublicLadder(DEFAULT_RATE_CARD);
  }
}
