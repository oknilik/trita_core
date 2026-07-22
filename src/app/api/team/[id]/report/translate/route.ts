import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import type {
  ReportTranslationEn,
  TranslatedActionItem,
} from "@/lib/team-report-i18n";

const schema = z.object({ reportId: z.string().min(1) });

// POST /api/team/[id]/report/translate — a tanácsadói narratíva gépi
// fordítása (HU → EN). A fordítást a tanácsadó a szerkesztőben átnézi és
// jóváhagyja; ez a végpont CSAK javaslatot generál, nem ment semmit.
// Modell: TRITA_TRANSLATE_MODEL env (default: claude-sonnet-4-5).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id: teamId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });
  if (!team?.orgId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Tanácsadói guard — a riport-route mintája (ORG_CONSULTANT szerep vagy
  // platform-tanácsadó / platform-admin).
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true },
  });
  const isConsultant =
    (membership && canViewRawTeamResults(membership.role)) ||
    profile.isConsultant ||
    isPlatformAdminEmail(profile.email);
  if (!isConsultant) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const report = await prisma.teamReport.findFirst({
    where: { id: body.data.reportId, teamId },
    select: {
      summary: true,
      strengths: true,
      risks: true,
      recommendations: true,
      interviewFindings: true,
      leadershipGuide: true,
      actionItems: true,
    },
  });
  if (!report) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TRANSLATE_NOT_CONFIGURED" }, { status: 503 });
  }

  const source = {
    summary: report.summary ?? "",
    strengths: report.strengths ?? "",
    risks: report.risks ?? "",
    recommendations: report.recommendations ?? "",
    interviewFindings: report.interviewFindings ?? "",
    leadershipGuide: report.leadershipGuide ?? "",
    actionItems: Array.isArray(report.actionItems) ? report.actionItems : [],
  };

  const prompt = `You are a professional Hungarian→English translator specialized in organizational psychology and management consulting. Translate the following team-report narrative fields from Hungarian to natural, professional business English.

Rules:
- Preserve the exact structure: keep "• " bullet prefixes and line breaks as-is.
- Keep the tone: professional, warm, non-clinical; this is a consultant's assessment for leaders.
- Do NOT translate proper nouns (team names, person names, product names like Trita, TRITAN).
- Translate psychological/management terminology precisely (e.g. „pszichológiai biztonság" → "psychological safety").
- Empty fields stay empty strings.
- Return ONLY a JSON object, no code fences, with exactly these keys:
  "summary", "strengths", "risks", "recommendations", "interviewFindings", "leadershipGuide" (strings) and "actionItems" (array of {"title","description","timeframe"} — translate title and description, keep timeframe unchanged).

Input JSON:
${JSON.stringify(source)}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.TRITA_TRANSLATE_MODEL ?? "claude-sonnet-4-5",
        max_tokens: 6000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      console.error("[translate] Anthropic API error", response.status, await response.text());
      return NextResponse.json({ error: "TRANSLATE_FAILED" }, { status: 502 });
    }
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;

    const str = (v: unknown): string | null =>
      typeof v === "string" && v.trim().length > 0 ? v : null;
    const items: TranslatedActionItem[] = Array.isArray(parsed.actionItems)
      ? (parsed.actionItems as Array<Record<string, unknown>>)
          .filter(
            (i) =>
              typeof i?.title === "string" &&
              typeof i?.description === "string" &&
              ["30", "60", "90"].includes(String(i?.timeframe)),
          )
          .map((i) => ({
            title: i.title as string,
            description: i.description as string,
            timeframe: String(i.timeframe) as TranslatedActionItem["timeframe"],
          }))
      : [];

    const translation: ReportTranslationEn = {
      status: "draft",
      translatedAt: new Date().toISOString(),
      summary: str(parsed.summary),
      strengths: str(parsed.strengths),
      risks: str(parsed.risks),
      recommendations: str(parsed.recommendations),
      interviewFindings: str(parsed.interviewFindings),
      leadershipGuide: str(parsed.leadershipGuide),
      actionItems: items.length > 0 ? items : null,
    };

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("[translate] failed", error);
    return NextResponse.json({ error: "TRANSLATE_FAILED" }, { status: 502 });
  }
}
