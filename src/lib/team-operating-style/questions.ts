/** Original experimental items. Never derive these answers from personality scores. */
export const OPERATING_STYLE_VERSION = "tos-pilot-1" as const;
export const AXES = ["information", "coordination", "decision", "execution"] as const;
export type OperatingAxis = (typeof AXES)[number];
export type Localized = { hu: string; en: string };
export const AXIS_LABELS: Record<OperatingAxis, { name: Localized; left: Localized; right: Localized }> = {
  information: { name: { hu: "Információ", en: "Information" }, left: { hu: "Strukturált", en: "Structured" }, right: { hu: "Informális", en: "Informal" } },
  coordination: { name: { hu: "Koordináció", en: "Coordination" }, left: { hu: "Explicit", en: "Explicit" }, right: { hu: "Organikus", en: "Organic" } },
  decision: { name: { hu: "Döntés", en: "Decision" }, left: { hu: "Centralizált", en: "Centralized" }, right: { hu: "Elosztott", en: "Distributed" } },
  execution: { name: { hu: "Végrehajtás", en: "Execution" }, left: { hu: "Tervvezérelt", en: "Plan-driven" }, right: { hu: "Adaptív", en: "Adaptive" } },
};
export const INSTRUCTIONS: Localized = {
  hu: "Az elmúlt négy hét közös munkájára gondolj ebben a csapatban. Azokban a helyzetekben, amikor az állítás értelmezhető volt, milyen gyakran történt így? A tényleges gyakorlatot jelöld. Ha nem volt ilyen helyzet, vagy nem láttál rá, válaszd a Nem megítélhető lehetőséget.",
  en: "Think about this team's work over the past four weeks. When the situation applied, how often did this happen? Describe actual practice. If the situation did not occur or you could not observe it, choose Unable to judge.",
};
export const RESPONSE_LABELS: Record<string, Localized> = {
  1: { hu: "Szinte soha", en: "Almost never" },
  2: { hu: "Ritkán", en: "Rarely" },
  3: { hu: "Az esetek körülbelül felében", en: "About half the time" },
  4: { hu: "Gyakran", en: "Often" },
  5: { hu: "Szinte mindig", en: "Almost always" },
  na: { hu: "Nem megítélhető", en: "Unable to judge" },
};
export interface OperatingItem { id: string; axis: OperatingAxis; pole: "left" | "right"; text: Localized }
export const ITEMS: readonly OperatingItem[] = [
  { id: "INF1", axis: "information", pole: "left", text: { hu: "A munkához szükséges háttérinformációkat közös, előre kialakított szerkezetben rögzítettük.", en: "We recorded background information for our work in a shared, predefined structure." } },
  { id: "INF2", axis: "information", pole: "right", text: { hu: "A feladat megértéséhez szükséges részleteket közvetlen beszélgetésekből szereztük meg.", en: "We obtained the details needed to understand a task through direct conversations." } },
  { id: "INF3", axis: "information", pole: "left", text: { hu: "Egy korábbi információt a közösen kijelölt nyilvántartásban kerestünk vissza.", en: "We looked up earlier information in the shared record designated for it." } },
  { id: "INF4", axis: "information", pole: "right", text: { hu: "Egy korábbi információért ahhoz a kollégához fordultunk, aki emlékezett rá.", en: "For earlier information, we turned to a colleague who remembered it." } },
  { id: "INF5", axis: "information", pole: "left", text: { hu: "A munkával kapcsolatos új tudnivalókat egységes sablon szerint adtuk tovább.", en: "We passed on new work-related information using a consistent template." } },
  { id: "INF6", axis: "information", pole: "right", text: { hu: "Az új tudnivalókat az adott helyzethez igazított, kötetlen üzenetekben adtuk tovább.", en: "We passed on new information in informal messages tailored to the situation." } },
  { id: "COO1", axis: "coordination", pole: "left", text: { hu: "Az egymásra épülő feladatok előtt külön tisztáztuk, ki kinek adja át a munkát.", en: "Before interdependent tasks, we explicitly agreed who would hand work over to whom." } },
  { id: "COO2", axis: "coordination", pole: "right", text: { hu: "Az egymásra épülő feladatokat a társaink haladását figyelve, külön egyeztetés nélkül kapcsoltuk össze.", en: "We linked interdependent tasks by watching colleagues' progress, without a separate coordination discussion." } },
  { id: "COO3", axis: "coordination", pole: "left", text: { hu: "Közös feladatnál kimondtuk, melyik résznek ki a felelőse.", en: "On shared tasks, we explicitly stated who was responsible for each part." } },
  { id: "COO4", axis: "coordination", pole: "right", text: { hu: "A közös feladat következő részét az vette át, aki a helyzetből látta, hogy rá van szükség.", en: "The next part of a shared task was picked up by whoever recognized that they were needed." } },
  { id: "COO5", axis: "coordination", pole: "left", text: { hu: "Mielőtt más munkájára építettünk, külön jeleztük egymásnak, hogy az átadható.", en: "Before building on another person's work, we explicitly signalled that it was ready for handover." } },
  { id: "COO6", axis: "coordination", pole: "right", text: { hu: "A megszokott közös munkamenetből tudtuk, mikor kapcsolódjunk be egymás feladataiba.", en: "Our familiar working rhythm told us when to join one another's tasks." } },
  { id: "DEC1", axis: "decision", pole: "left", text: { hu: "A felmerülő szakmai alternatívák közül ugyanaz a kijelölt vezető választotta ki, melyikkel haladjunk tovább.", en: "The same designated leader selected which work option we would pursue." } },
  { id: "DEC2", axis: "decision", pole: "right", text: { hu: "A feladaton dolgozó kollégák saját hatáskörben választottak a szakmai alternatívák közül.", en: "Colleagues doing the task chose between work options within their own authority." } },
  { id: "DEC3", axis: "decision", pole: "left", text: { hu: "A munkát érintő választás véglegesítéséhez a kijelölt vezető jóváhagyását kértük.", en: "We sought the designated leader's approval to finalize a work-related choice." } },
  { id: "DEC4", axis: "decision", pole: "right", text: { hu: "A döntési jog annál a csapattagnál volt, akinek az adott szakterületéhez tartozott a kérdés.", en: "Decision authority rested with the team member whose area of expertise covered the issue." } },
  { id: "DEC5", axis: "decision", pole: "left", text: { hu: "Ha több megoldás maradt versenyben, a végső szót a kijelölt vezető mondta ki.", en: "When several options remained, the designated leader had the final say." } },
  { id: "DEC6", axis: "decision", pole: "right", text: { hu: "Az érintett csapattagok közösen hozták meg a végső döntést, külön vezetői jóváhagyás nélkül.", en: "The affected team members made the final decision together, without separate leader approval." } },
  { id: "EXE1", axis: "execution", pole: "left", text: { hu: "A munka lépéseit az induláskor kijelölt sorrendben végeztük el.", en: "We completed work steps in the order set at the start." } },
  { id: "EXE2", axis: "execution", pole: "right", text: { hu: "A munka közben szerzett tapasztalatok alapján átrendeztük a következő lépések sorrendjét.", en: "We reordered the next steps based on what we learned during the work." } },
  { id: "EXE3", axis: "execution", pole: "left", text: { hu: "A következő munkalépést az előre elkészített ütemezésből vettük.", en: "We took the next work step from the schedule prepared in advance." } },
  { id: "EXE4", axis: "execution", pole: "right", text: { hu: "Egy köztes eredmény kipróbálása után módosítottuk a folytatás menetét.", en: "After trying an interim result, we changed how we would continue." } },
  { id: "EXE5", axis: "execution", pole: "left", text: { hu: "A végrehajtás során az előre meghatározott munkamenetet követtük.", en: "During execution, we followed the workflow defined in advance." } },
  { id: "EXE6", axis: "execution", pole: "right", text: { hu: "Új visszajelzés érkezésekor átalakítottuk a még hátralévő munka menetét.", en: "When new feedback arrived, we revised the remaining workflow." } },
];
