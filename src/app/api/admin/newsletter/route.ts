import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLogger } from "@/lib/logger.server";
import { getNewsletterStats } from "@/lib/newsletter";
import { runBlogDigest } from "@/lib/newsletter-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin hírlevél-kezelés (`/admin?tab=blog`).
 *
 *   GET                 — feliratkozó-számok (DB-ből, nem eseményből)
 *   GET ?format=csv     — az AKTÍV feliratkozók exportja
 *   POST { slug }       — egy cikk értesítőjének kiküldése kézzel
 *   POST { slug, dryRun } — próbafutás: megmondja, hánynak menne
 *
 * A kézi küldés ugyanazt a motort hívja, mint a cron, tehát ugyanaz a napló
 * védi a kettős küldéstől: aki már megkapta a cikket, nem kapja meg újra.
 */
export async function GET(req: NextRequest) {
  await requireAdmin();

  if (req.nextUrl.searchParams.get("format") === "csv") {
    const rows = await prisma.newsletterSubscriber.findMany({
      where: { status: "ACTIVE" },
      select: { email: true, locale: true, source: true, confirmedAt: true },
      orderBy: { confirmedAt: "asc" },
    });

    // Minimális CSV-idézés: a mezők zárt értékkészletűek vagy e-mail-címek,
    // de az idézőjel-duplázás így is kötelező (a cím tartalmazhat ritka jelet).
    const csv = [
      "email,locale,source,confirmedAt",
      ...rows.map((r) =>
        [r.email, r.locale, r.source, r.confirmedAt?.toISOString() ?? ""]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"',
      },
    });
  }

  return NextResponse.json(await getNewsletterStats());
}

const sendSchema = z
  .object({
    slug: z.string().min(3).max(120),
    dryRun: z.boolean().optional(),
  })
  .strict();

export async function POST(req: Request) {
  await requireAdmin();
  const log = await getRequestLogger("newsletter-admin");

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  try {
    const result = await runBlogDigest({
      onlySlug: parsed.data.slug,
      dryRun: parsed.data.dryRun,
    });
    log.info(
      {
        event: "newsletter.manual_send",
        slug: parsed.data.slug,
        dryRun: Boolean(parsed.data.dryRun),
        recipients: result.sent.reduce((sum, s) => sum + s.recipients, 0),
      },
      "Manual newsletter send",
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error(
      { event: "newsletter.manual_send_failed", slug: parsed.data.slug, err: error },
      "Manual newsletter send failed",
    );
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }
}
