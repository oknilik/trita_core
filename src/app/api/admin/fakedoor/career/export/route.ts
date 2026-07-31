import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CAREER_FAKE_DOOR_MODULE } from "@/lib/fakedoor/career";

// Nyers export (T17). A riport-oldal az összesítést mutatja; ide azért kell
// a sor-szintű adat, mert a mérésből levont következtetést kézzel is
// ellenőrizni kell tudni — egy aggregátumban a hiba nem látszik.
//
// Az e-mail BENNE van: a válaszadó kifejezetten megadta, hogy szóljunk neki,
// és az admin körnek amúgy is dolga vele. Az export nem publikus végpont.

function csvCell(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  await requireAdmin();

  const rows = await prisma.fakeDoorResponse.findMany({
    where: { module: CAREER_FAKE_DOOR_MODULE },
    orderBy: { respondedAt: "desc" },
  });

  const header = [
    "respondedAt",
    "viewedAt",
    "audience",
    "priceVariant",
    "interest",
    "valueGoal",
    "reasonNo",
    "maxPriceHuf",
    "otherText",
    "emailOptIn",
    "email",
    "source",
    "sessionId",
    "userId",
  ];

  const body = rows.map((row) =>
    [
      row.respondedAt.toISOString(),
      row.viewedAt.toISOString(),
      row.audience,
      row.priceVariant,
      row.interest,
      row.valueGoal,
      row.reasonNo,
      row.maxPriceHuf,
      row.otherText,
      row.emailOptIn,
      row.email,
      row.source,
      row.sessionId,
      row.userId,
    ]
      .map(csvCell)
      .join(","),
  );

  // BOM: enélkül az Excel a magyar ékezeteket elrontja.
  const csv = `﻿${[header.join(","), ...body].join("\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fakedoor-career-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
