// ─────────────────────────────────────────────────────────────────────
// Tömeges meghívás — közös séma, listaelemzés és kimenet-típusok.
//
// MIÉRT: a pilot kerete 15–20 csapat és 200–500 egyéni kitöltő, a meghívó
// űrlapok viszont egyetlen címet fogadtak (`z.object({ email })`). Ötszáz
// embert egyesével, kézzel, űrlapon át felvinni a program legdrágább és
// teljesen automatizálható munkaóráját jelentette.
//
// Prisma- és React-mentes: a kliens (beillesztett szöveg elemzése, előnézet)
// és a szerver (validálás) UGYANEZT a modult használja, tehát a szabályok nem
// tudnak szétcsúszni.
// ─────────────────────────────────────────────────────────────────────

import { z } from "zod";

/**
 * Egy kérésben feldolgozott címek felső korlátja.
 *
 * MIÉRT 25 ÉS NEM 500: minden új címhez kimegy egy meghívó levél, sorban. Egy
 * 500-as kötegnél a kérés jóval a szerver-nélküli futásidő-korlát fölé nőne,
 * és félúton elvágva sem tudnánk, mi ment ki. A kliens ezért 25-ös kötegekre
 * bontja a beillesztett listát, és köteg-szinten mutat haladást — így egy
 * megszakadt köteg is pontosan azonosítható, az addigi munka pedig megmarad.
 */
export const BULK_INVITE_BATCH_SIZE = 25;

/** Egy címre vonatkozó kimenet. A kliens ebből építi az összegzést. */
export type BulkInviteStatus =
  /** Létező felhasználó — azonnal tag lett. */
  | "added"
  /** Nem létező felhasználó — függő meghívó készült, levél kiment. */
  | "invited"
  /** Függő meghívó készült, de a levél NEM ment ki (Resend-hiba). */
  | "invited_no_email"
  /** Már tag, vagy már van függő meghívója. */
  | "already_member"
  /** A meghívó saját magát próbálta meghívni. */
  | "self_invite"
  /** Váratlan hiba ezen az egy címen — a köteg többi eleme ettől még megy. */
  | "failed";

export interface BulkInviteResult {
  email: string;
  status: BulkInviteStatus;
}

/** A kötegelt kérés törzse. Az egyelemű (legacy) `email` alak külön ág. */
export const bulkInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(BULK_INVITE_BATCH_SIZE),
});

/**
 * Beillesztett szöveg → címlista.
 *
 * Elválasztó bármi életszerű: sortörés, vessző, pontosvessző, tabulátor,
 * szóköz. A `Név <cim@pelda.hu>` alak is kezelt, mert a levelezőből kimásolt
 * lista tipikusan így néz ki.
 *
 * A kis/nagybetűt normalizáljuk és duplikátumot szűrünk — enélkül egy
 * duplán beillesztett lista fele „már tag" hibát adna vissza, ami elfedi a
 * valódi problémákat.
 */
export function parseEmailList(raw: string): { emails: string[]; invalid: string[] } {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const emails: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    // `Név <cim@pelda.hu>` → `cim@pelda.hu`
    const angled = token.match(/<([^>]+)>/);
    const candidate = (angled ? angled[1] : token).replace(/^[<"']+|[>"',.]+$/g, "").toLowerCase();

    if (!candidate) continue;

    if (!z.string().email().safeParse(candidate).success) {
      if (!invalid.includes(token)) invalid.push(token);
      continue;
    }

    if (seen.has(candidate)) continue;
    seen.add(candidate);
    emails.push(candidate);
  }

  return { emails, invalid };
}

/** A listát a szerver által elfogadott méretű kötegekre bontja. */
export function chunkEmails(
  emails: string[],
  size: number = BULK_INVITE_BATCH_SIZE,
): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < emails.length; index += size) {
    chunks.push(emails.slice(index, index + size));
  }
  return chunks;
}

/** Státuszonkénti darabszám — az összegző sávhoz. */
export function summarizeBulkInvite(results: BulkInviteResult[]): Record<BulkInviteStatus, number> {
  const summary: Record<BulkInviteStatus, number> = {
    added: 0,
    invited: 0,
    invited_no_email: 0,
    already_member: 0,
    self_invite: 0,
    failed: 0,
  };
  for (const result of results) summary[result.status] += 1;
  return summary;
}
