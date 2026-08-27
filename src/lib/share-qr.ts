import QRCode from "qrcode";
import { COLORS } from "@/lib/design-tokens";
import { createLogger } from "@/lib/logger";

const log = createLogger("share-qr");

/**
 * Szerver-oldali QR PNG a megosztó emailhez — a modal-beli QR-blokk kiváltása:
 * a kód a levélben utazik, a címzett telefonnal beolvasva azonnal a megosztott
 * profilra jut. Best-effort: generálási hiba esetén null-t ad vissza, a hívó
 * (send-route) a levelet QR nélkül küldi ki — a küldést a QR sosem buktatja.
 */
export async function generateShareQrPng(url: string): Promise<Buffer | null> {
  try {
    return await QRCode.toBuffer(url, {
      type: "png",
      width: 320,
      margin: 1,
      // Fehér háttér (nem cream): az email-kliensek sötét módban is fehér
      // dobozban mutatják, a kontraszt így marad biztosan beolvasható.
      color: { dark: COLORS.ink, light: "#ffffff" },
    });
  } catch (err) {
    log.warn({ event: "share_qr.generate_failed", err }, "Share QR generation failed – email goes out without QR");
    return null;
  }
}
