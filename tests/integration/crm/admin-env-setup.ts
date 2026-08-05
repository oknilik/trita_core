/**
 * CRM integration env-setup — a teszt-fájl ELSŐ importjának kell lennie.
 *
 * Az ADMIN_EMAILS a lib/auth modul-szintű konstansába záródik be az első
 * import pillanatában, ezért a process.env-et még azelőtt kell beállítani,
 * hogy bármelyik @/lib/* import kiértékelődne (az ESM az import-deklarációk
 * sorrendjében értékel). A RESEND_API_KEY kiürítése a reflection-sweep
 * teszt mintája: az email-láb determinisztikusan a hiba-ágra megy,
 * .env fájlhoz nem nyúlunk.
 */

import { randomUUID } from "node:crypto";

export const CRM_TEST_ADMIN_EMAIL = `crm-admin-${randomUUID()
  .replace(/-/g, "")
  .slice(0, 10)}@test.trita.app`;

process.env.ADMIN_EMAILS = CRM_TEST_ADMIN_EMAIL;
process.env.RESEND_API_KEY = "";
