/**
 * GENERÁLT FÁJL — ne szerkeszd kézzel.
 * Forrás: `scripts/build-email-art.ts` (futtatás: pnpm build:email-art)
 *
 * A levél-eszközök megjelenítési mérete. Az `<img>` width/height attribútuma
 * ezekből jön: az arány elrontása minden levélben látszana, és a kliens-oldali
 * átméretezés a leggyakoribb forrása a homályos logónak.
 */
export const EMAIL_ART = {
  wordmark: { file: "wordmark.png", width: 55, height: 31 },
  mark: { file: "mark.png", width: 40, height: 40 },
} as const;
