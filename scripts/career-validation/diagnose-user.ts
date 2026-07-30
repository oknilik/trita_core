/**
 * Egy felhasználó karrier-eredményének diagnosztikája — mit lát, és MIÉRT.
 *
 *   npx tsx scripts/career-validation/diagnose-user.ts <email>
 *
 * Kiírja a mentett wizard-válaszokat, a motor bemenetét (mit vesz figyelembe és
 * mit nem), majd a három szakaszra bontott listát a rangsor-összetevőkkel.
 */
import { prisma } from "../../src/lib/prisma";
import { buildPersonInput } from "../../src/lib/career/person";
import { computeCareerFit } from "../../src/lib/career/engine";
import { userTopLetters } from "../../src/lib/career/interests";
import type { EntryLevel, OccupationFit } from "../../src/lib/career/types";

const ENTRY_RANK: Record<EntryLevel, number> = {
  open: 0,
  course: 1,
  vocational: 2,
  higher: 3,
  specialized: 4,
};
const EDU_RANK: Record<string, number> = {
  primary: 0,
  secondary: 1,
  vocational: 2,
  higher: 3,
};

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("használat: diagnose-user.ts <email>");

  const profile = await prisma.userProfile.findFirst({
    where: { email },
    select: { id: true, birthYear: true, careerBackground: true },
  });
  if (!profile) throw new Error(`nincs ilyen profil: ${email}`);

  const background = (profile.careerBackground ?? {}) as Record<string, unknown>;
  console.log("── MENTETT WIZARD-VÁLASZOK ──────────────────────────────");
  for (const [key, value] of Object.entries(background)) {
    console.log(`  ${key.padEnd(22)} ${JSON.stringify(value)}`);
  }
  console.log(`  birthYear (profil)     ${profile.birthYear ?? "—"}`);

  const { person, hasSelfResult, observerCount } = await buildPersonInput(profile.id);
  console.log("\n── A MOTOR BEMENETE ─────────────────────────────────────");
  console.log(`  önértékelés: ${hasSelfResult ? "van" : "NINCS"} · observer: ${observerCount} fő`);
  console.log(`  dimenziók:   ${JSON.stringify(person.dims)}`);
  console.log(
    `  érdeklődés:  ${person.interests ? `${userTopLetters(person.interests.vector)} (${person.interests.source})` : "nincs"}`,
  );
  console.log(`  preferenciák: ${JSON.stringify(person.prefs ?? {})}`);
  console.log(`  végzettség:  ${person.eduLevel ?? "—"} · vezetői szándék: ${person.leadIntent}`);
  console.log(`  vétók:       ${person.vetoes?.length ? person.vetoes.join(", ") : "nincs"}`);

  const industries = (background.interests as string[] | undefined) ?? [];
  // A service scope-feloldását tükrözzük: a bejelölt terület kemény szűrő.
  const result = computeCareerFit(person, { limit: 60, industries, scope: industries });
  console.log(
    `  rangsorolás: ${result.meta.strategy}` +
      (result.meta.candidatePool !== null
        ? ` (jelölt-halmaz: ${result.meta.candidatePool} tétel az érdeklődés szerint)`
        : "") +
      (result.meta.vetoExcluded ? ` · vétó kizárt: ${result.meta.vetoExcluded}` : ""),
  );

  const edu = EDU_RANK[person.eduLevel ?? ""] ?? null;
  const bucketOf = (fit: OccupationFit) => {
    const entry = ENTRY_RANK[fit.entry];
    if (edu === null) return entry <= 1 ? "MOST ELÉRHETŐ" : "TANULÁSSAL";
    if (entry > edu) return "TANULÁSSAL";
    if (entry >= edu - 1) return "MOST ELÉRHETŐ";
    return "SZINT ALATT";
  };

  const buckets = new Map<string, OccupationFit[]>();
  for (const fit of result.ranked) {
    const key = bucketOf(fit);
    buckets.set(key, [...(buckets.get(key) ?? []), fit]);
  }

  for (const name of ["MOST ELÉRHETŐ", "TANULÁSSAL", "SZINT ALATT"]) {
    const list = buckets.get(name) ?? [];
    console.log(`\n── ${name} (${list.length}) ─────────────────────────`);
    for (const fit of list.slice(0, 8)) {
      console.log(
        `  ${fit.hu.padEnd(32)} rang=${String(fit.rank).padStart(3)} ` +
          `illeszk=${String(fit.demandFit).padStart(3)} érdekl=${String(fit.interest ?? "—").padStart(3)} ` +
          `pref=${String(fit.preference ?? "—").padStart(3)} belépés=${fit.entry}` +
          `${fit.flags.includes("industry-pick") ? " [bejelölt terület]" : ""}`,
      );
    }
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
