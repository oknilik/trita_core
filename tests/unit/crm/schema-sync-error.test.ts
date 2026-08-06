import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { schemaOutOfSyncDetail } from "@/lib/crm/errors";

// Migráció-lemaradás-felismerés (P2021/P2022 → állapotkártya, minden más
// hiba felfut). A hibaobjektumok a Prisma runtime alakját követik
// (name + code + meta), ahogy a valódi kliens dobja.

function prismaError(code: string, meta?: Record<string, unknown>) {
  const err = new Error(`Prisma error ${code}`) as Error & {
    code?: string;
    meta?: Record<string, unknown>;
  };
  Object.defineProperty(err, "name", { value: "PrismaClientKnownRequestError" });
  err.code = code;
  err.meta = meta;
  return err;
}

describe("schemaOutOfSyncDetail", () => {
  it("P2021 (hiányzó tábla) → detail a tábla nevével", () => {
    const detail = schemaOutOfSyncDetail(prismaError("P2021", { table: "public.Deal" }));
    assert.deepEqual(detail, { code: "P2021", target: "public.Deal" });
  });

  it("P2022 (hiányzó oszlop) → detail az oszlop nevével", () => {
    const detail = schemaOutOfSyncDetail(prismaError("P2022", { column: "Inquiry.dealId" }));
    assert.deepEqual(detail, { code: "P2022", target: "Inquiry.dealId" });
  });

  it("meta nélkül is felismeri, target nélkül", () => {
    const detail = schemaOutOfSyncDetail(prismaError("P2021"));
    assert.deepEqual(detail, { code: "P2021", target: null });
  });

  it("más Prisma-hibakód (P2002) → null, a hiba felfut", () => {
    assert.equal(schemaOutOfSyncDetail(prismaError("P2002", { target: ["email"] })), null);
  });

  it("nem-Prisma Error és nem-Error érték → null", () => {
    assert.equal(schemaOutOfSyncDetail(new Error("általános hiba")), null);
    assert.equal(schemaOutOfSyncDetail("string hiba"), null);
    assert.equal(schemaOutOfSyncDetail(null), null);
  });
});
