/**
 * CRM UI pure segédek — halasztó-dátum (UTC nap-határ + napközi óra),
 * date-input ↔ ISO konverzió, relatív kor-címke. A guards.resolveDueBucket
 * ablakaival való konzisztencia itt van rögzítve: a +N napos halasztás
 * mindig az N. nap „today" bucketjébe esik.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  computePostponeAt,
  crmErrorText,
  dayInputToIso,
  isoToDayInput,
  relativeDayLabel,
} from "@/components/admin/crm/crm-ui";
import { resolveDueBucket } from "@/lib/crm/guards";
import { POSTPONE_PRESETS } from "@/lib/crm/constants";

test("crm-ui segédek", async (t) => {
  await t.test("computePostponeAt: minden preset a cél-nap „today” bucketjébe esik", () => {
    const now = new Date("2026-08-05T22:30:00.000Z"); // késő esti UTC — nap-határ közel
    for (const days of POSTPONE_PRESETS) {
      const iso = computePostponeAt(days, now);
      const target = new Date(iso);
      // Az N nappal későbbi nap reggelén ez a lépés pont „ma esedékes”.
      const onTargetDay = new Date(
        Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 6),
      );
      assert.equal(resolveDueBucket(target, onTargetDay), "today", `+${days} nap`);
      // A halasztás napján viszont még „upcoming”.
      assert.equal(resolveDueBucket(target, now), "upcoming", `+${days} nap (ma)`);
    }
  });

  await t.test("computePostponeAt: +1 nap a következő UTC-napra esik", () => {
    const now = new Date("2026-12-31T23:59:00.000Z"); // évváltás-határ
    const iso = computePostponeAt(1, now);
    assert.equal(iso, "2027-01-01T09:00:00.000Z");
  });

  await t.test("dayInputToIso ↔ isoToDayInput oda-vissza konzisztens", () => {
    const iso = dayInputToIso("2026-08-12");
    assert.equal(iso, "2026-08-12T09:00:00.000Z");
    assert.equal(isoToDayInput(iso), "2026-08-12");
  });

  await t.test("relativeDayLabel: ma / tegnap / N napja (UTC nap-határokkal)", () => {
    const now = new Date("2026-08-05T08:00:00.000Z");
    assert.equal(relativeDayLabel("2026-08-05T01:00:00.000Z", now), "ma");
    assert.equal(relativeDayLabel("2026-08-04T23:00:00.000Z", now), "tegnap");
    assert.equal(relativeDayLabel("2026-08-01T12:00:00.000Z", now), "4 napja");
  });

  await t.test("crmErrorText: ismert kód HU szöveg, ismeretlen kód fallback", () => {
    assert.match(crmErrorText("LOST_REASON_REQUIRED"), /kötelező/i);
    assert.match(crmErrorText("SOMETHING_ELSE"), /nem sikerült/i);
    assert.match(crmErrorText(null), /nem sikerült/i);
  });
});
