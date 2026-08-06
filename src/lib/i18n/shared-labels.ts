// Két kulcs, amit a PUBLIKUS landing-hero és az EREDMÉNY-oldal egyaránt
// használ (munkakör-illeszkedés). Azért él külön, hogy a publikus szótár
// (public.ts) is fel tudja oldani anélkül, hogy a 137 KB-os results.ts
// bekerülne a marketing-oldalak kliens-bundle-jébe. A definíció EGY helyen
// van — a teljes szótár (index.ts) is innen kapja.

export const sharedLabelTranslations = {
  results: {
    // UX-B12: a szomszédos „Csapatszerep-hajlamok" szekcióval ütközött a
    // „szerep" — ez itt munkakör-típusok illeszkedése, nem csapatszerep.
    roleFitEyebrow: { hu: "Munkakör-illeszkedés", en: "Work-role fit" },
  },
  content: {
    roleFitStrong: { hu: "Jól illeszkedsz ide", en: "You fit well here" },
  },
};
