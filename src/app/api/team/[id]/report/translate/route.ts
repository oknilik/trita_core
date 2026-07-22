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

  // Tag-alapú kimenet — a JSON-kimenet törékeny volt (a modell escape-elési
  // hibái parse-hibát okoztak); a tagek közti nyers szöveg soremelésekkel,
  // idézőjelekkel együtt biztonságosan kinyerhető.
  const actionsBlock = source.actionItems
    .map(
      (item, i) =>
        `<action index="${i}" timeframe="${(item as { timeframe?: string }).timeframe ?? "30"}">\n<title>${(item as { title?: string }).title ?? ""}</title>\n<description>${(item as { description?: string }).description ?? ""}</description>\n</action>`,
    )
    .join("\n");

  const prompt = `You are a professional Hungarian→English translator specialized in organizational psychology and management consulting. Translate the team-report narrative below from Hungarian to natural, professional business English.

Rules:
- Preserve the exact structure inside each field: keep "• " bullet prefixes and line breaks as-is.
- Keep the tone: professional, warm, non-clinical; this is a consultant's assessment for leaders.
- Do NOT translate proper nouns (team names, person names, product names like Trita, TRITAN).
- Translate psychological/management terminology precisely (e.g. „pszichológiai biztonság" → "psychological safety").
- Respond with ONLY the tags below, in this exact format, nothing else. Empty input fields → empty tag content.

Output format:
<summary>...</summary>
<strengths>...</strengths>
<risks>...</risks>
<recommendations>...</recommendations>
<interviewFindings>...</interviewFindings>
<leadershipGuide>...</leadershipGuide>
<action index="0" timeframe="30"><title>...</title><description>...</description></action>
(one <action> per input action, same index and timeframe)

Input fields (Hungarian):
<summary>${source.summary}</summary>
<strengths>${source.strengths}</strengths>
<risks>${source.risks}</risks>
<recommendations>${source.recommendations}</recommendations>
<interviewFindings>${source.interviewFindings}</interviewFindings>
<leadershipGuide>${source.leadershipGuide}</leadershipGuide>
${actionsBlock}`;

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

    // Tag-kinyerés — újsor/idézőjel-biztos (a korábbi JSON-parse törékeny volt).
    const tag = (name: string): string | null => {
      const m = text.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
      const value = m?.[1]?.trim() ?? "";
      return value.length > 0 ? value : null;
    };

    const items: TranslatedActionItem[] = [];
    const actionRe =
      /<action[^>]*timeframe="(30|60|90)"[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/action>/g;
    let actionMatch: RegExpExecArray | null;
    while ((actionMatch = actionRe.exec(text))) {
      const title = actionMatch[2].trim();
      const description = actionMatch[3].trim();
      if (title.length > 0) {
        items.push({
          title,
          description,
          timeframe: actionMatch[1] as TranslatedActionItem["timeframe"],
        });
      }
    }

    const translation: ReportTranslationEn = {
      status: "draft",
      translatedAt: new Date().toISOString(),
      summary: tag("summary"),
      strengths: tag("strengths"),
      risks: tag("risks"),
      recommendations: tag("recommendations"),
      interviewFindings: tag("interviewFindings"),
      leadershipGuide: tag("leadershipGuide"),
      actionItems: items.length > 0 ? items : null,
    };

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("[translate] failed", error);
    return NextResponse.json({ error: "TRANSLATE_FAILED" }, { status: 502 });
  }
}
