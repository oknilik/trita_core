import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * A szerveren renderelt PDF-ekhez fájlrendszer-útvonal kell; a böngészős
 * `/fonts/...` URL-eket a react-pdf Node környezetben nem tudja feloldani.
 */
export function registerServerPdfFonts(
  fontDir = join(process.cwd(), "public", "fonts"),
): void {
  if (registered) return;

  Font.register({
    family: "Fraunces",
    fonts: [
      { src: join(fontDir, "Fraunces-Regular.ttf"), fontWeight: 400 },
      { src: join(fontDir, "Fraunces-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "DM Sans",
    fonts: [
      { src: join(fontDir, "DMSans-Regular.ttf"), fontWeight: 400 },
      { src: join(fontDir, "DMSans-Medium.ttf"), fontWeight: 500 },
      { src: join(fontDir, "DMSans-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
