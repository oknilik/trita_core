import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Coaching Debrief | Trita", robots: { index: false } };
}

export default async function OutputPage({
  params,
}: {
  params: Promise<{ cacheKey: string }>;
}) {
  const [locale, { userId }, { cacheKey: encodedKey }] = await Promise.all([
    getServerLocale(),
    auth(),
    params,
  ]);
  if (!userId) redirect("/sign-in");

  const coach = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!coach || coach.role !== "COACH") redirect("/dashboard");

  const cacheKey = decodeURIComponent(encodedKey);

  const output = await prisma.generatedOutput.findUnique({
    where: { cacheKey },
    select: {
      content: true,
      model: true,
      hitCount: true,
      createdAt: true,
      clientId: true,
      cacheKey: true,
    },
  });

  if (!output) notFound();

  const client = await prisma.userProfile.findUnique({
    where: { id: output.clientId },
    select: { id: true, username: true, email: true },
  });

  const isHu = locale !== "en" && locale !== "de";
  const clientName = client?.username ?? client?.email ?? output.clientId;
  const sections = parseIntoSections(output.content);

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">

        {/* Back + header */}
        <div>
          {client && (
            <Link
              href={`/coach/clients/${client.id}`}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-4"
            >
              ← {clientName}
            </Link>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Coaching Debrief</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span>{clientName}</span>
            <span>·</span>
            <span>
              {output.createdAt.toLocaleDateString(
                locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU"
              )}
            </span>
            <span>·</span>
            <span>{output.model}</span>
            {output.hitCount > 1 && (
              <>
                <span>·</span>
                <span>{isHu ? `${output.hitCount}× lekérve` : `${output.hitCount}× fetched`}</span>
              </>
            )}
          </div>
        </div>

        {/* Section cards */}
        <div className="flex flex-col gap-4">
          {sections.map((section, i) => {
            const type = getSectionType(section.heading);
            const style = SECTION_STYLES[type];
            return (
              <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-5 md:p-6`}>
                {section.heading && (
                  <h2 className={`text-base font-bold ${style.heading} mb-3`}>
                    {section.heading}
                  </h2>
                )}
                <div className="flex flex-col gap-2">
                  {section.lines.map((line, j) => renderSectionLine(line, type, j, style))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/coach"
            className="min-h-[44px] inline-flex items-center rounded-lg border border-gray-100 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {isHu ? "Dashboard" : "Dashboard"}
          </Link>
        </div>
      </main>
    </div>
  );
}

// ─── Section parsing ──────────────────────────────────────────────────────────

type SectionType = "summary" | "strengths" | "development" | "observer" | "actions" | "questions" | "default";

function parseIntoSections(content: string): Array<{ heading: string; lines: string[] }> {
  const result: Array<{ heading: string; lines: string[] }> = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      if (currentLines.length > 0 || currentHeading) {
        result.push({ heading: currentHeading, lines: currentLines });
      }
      currentHeading = line.slice(3).trim();
      currentLines = [];
    } else if (line.startsWith("---")) {
      // skip horizontal rules
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0 || currentHeading) {
    result.push({ heading: currentHeading, lines: currentLines });
  }
  // Drop any intro lines before first heading
  return result.filter((s) => s.heading || s.lines.some((l) => l.trim()));
}

function getSectionType(heading: string): SectionType {
  if (heading.includes("✓") || /erősség|strength/i.test(heading)) return "strengths";
  if (heading.includes("⚠") || /fejlesztés|development area/i.test(heading)) return "development";
  if (/observer|visszajelzés|hogyan látnak/i.test(heading) || heading.includes("👁")) return "observer";
  if (heading.includes("→") || /következő|next step|ajánlás/i.test(heading)) return "actions";
  if (heading.includes("?") || /coaching kérdés|question/i.test(heading)) return "questions";
  if (/összefoglal|summary/i.test(heading)) return "summary";
  return "default";
}

const SECTION_STYLES: Record<SectionType, { bg: string; border: string; heading: string; dot: string; numBadge: string }> = {
  summary:     { bg: "bg-indigo-50",  border: "border-indigo-100",  heading: "text-indigo-900",  dot: "bg-indigo-400",  numBadge: "bg-indigo-100 text-indigo-700" },
  strengths:   { bg: "bg-green-50",   border: "border-green-100",   heading: "text-green-900",   dot: "bg-green-500",   numBadge: "bg-green-100 text-green-700" },
  development: { bg: "bg-amber-50",   border: "border-amber-100",   heading: "text-amber-900",   dot: "bg-amber-500",   numBadge: "bg-amber-100 text-amber-700" },
  observer:    { bg: "bg-sky-50",     border: "border-sky-100",     heading: "text-sky-900",     dot: "bg-sky-500",     numBadge: "bg-sky-100 text-sky-700" },
  actions:     { bg: "bg-white",      border: "border-indigo-100",  heading: "text-indigo-900",  dot: "bg-indigo-400",  numBadge: "bg-indigo-100 text-indigo-700" },
  questions:   { bg: "bg-purple-50",  border: "border-purple-100",  heading: "text-purple-900",  dot: "bg-purple-400",  numBadge: "bg-purple-100 text-purple-700" },
  default:     { bg: "bg-white",      border: "border-gray-100",    heading: "text-gray-900",    dot: "bg-gray-400",    numBadge: "bg-gray-100 text-gray-600" },
};

// ─── Line renderer ────────────────────────────────────────────────────────────

function renderSectionLine(
  line: string,
  type: SectionType,
  key: number,
  style: (typeof SECTION_STYLES)[SectionType]
): React.ReactNode {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Numbered item
  const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
  if (numMatch) {
    return (
      <div key={key} className="flex gap-3 items-start">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.numBadge}`}>
          {numMatch[1]}
        </span>
        <p className="text-sm text-gray-700 leading-relaxed flex-1">{renderInline(numMatch[2])}</p>
      </div>
    );
  }

  // Bullet
  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    return (
      <div key={key} className="flex gap-3 items-start">
        <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
        <p className="text-sm text-gray-700 leading-relaxed flex-1">{renderInline(trimmed.slice(2))}</p>
      </div>
    );
  }

  // Bold-only line (**...**)
  if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
    return (
      <p key={key} className="text-sm font-semibold text-gray-900">{trimmed.slice(2, -2)}</p>
    );
  }

  // Regular paragraph
  return (
    <p key={key} className="text-sm text-gray-700 leading-relaxed">{renderInline(trimmed)}</p>
  );
}

// ─── Inline bold/italic renderer ─────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) parts.push(<strong key={key++}>{match[1]}</strong>);
    else if (match[2] !== undefined) parts.push(<em key={key++}>{match[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}
