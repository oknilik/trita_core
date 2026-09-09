import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { loadRateCard } from "@/lib/quote/rate-card.server";
import { loadFxRate } from "@/lib/pricing/fx.server";
import { derivePublicLadder, type PublicLadder } from "@/lib/pricing/team-ladder";

// A publikus árlétra betöltése a szerver-oldali (marketing) oldalakhoz.
//
// Fail-open az ALAPÉRTELMEZETT kártyára: a marketing-oldal build-időben
// (dummy env, nincs DB) és DB-kiesésnél is renderelődjön, a beépített
// számokkal. A mentett kártya a következő ISR-körben (vagy az admin
// mentéskor kiváltott revalidálással) átveszi a helyét.
//
// Az árfolyam (az angol felület euró-összegeihez) ugyanígy fail-open: a
// napi középárfolyam helyett a tartalék-árfolyam, amíg a forrás nem elérhető.

export async function loadPublicLadder(): Promise<PublicLadder> {
  const [rate, fx] = await Promise.all([
    loadRateCard()
      .then((loaded) => loaded.rate)
      .catch(() => DEFAULT_RATE_CARD),
    loadFxRate(),
  ]);
  return derivePublicLadder(rate, fx);
}
