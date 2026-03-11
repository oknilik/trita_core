import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FadeIn } from "@/components/landing/FadeIn";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Coaching Debrief | Trita", robots: { index: false, follow: false } };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const output = await prisma.generatedOutput.findUnique({
    where: { shareToken: token },
    select: { content: true, model: true, createdAt: true },
  });

  if (!output) notFound();

  const sections = parseIntoSections(output.content);

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">

        {/* Header */}
        <FadeIn>
          <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-7 shadow-md shadow-indigo-200/40">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Coaching debrief
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Trita
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>{output.createdAt.toLocaleDateString("hu-HU")}</span>
                <span>·</span>
                <span>{output.model}</span>
                <span>·</span>
                <span className="italic">Read-only shared view</span>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Section cards */}
        <div className="flex flex-col gap-4">
          {sections.map((section, i) => {
            const type = getSectionType(section.heading);
            const style = SECTION_STYLES[type];
            return (
              <FadeIn key={i} delay={0.05 + i * 0.04}>
                <div className={`rounded-xl border ${style.border} ${style.bg} p-5 md:p-6`}>
                  {section.heading && (
                    <h2 className={`text-base font-bold ${style.heading} mb-3`}>
                      {section.heading}
                    </h2>
                  )}
                  <div className="flex flex-col gap-2">
                    {section.lines.map((line, j) => renderSectionLine(line, type, j, style))}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Footer */}
        <FadeIn delay={0.15}>
          <div className="flex items-center justify-center pt-4">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              Powered by Trita
            </Link>
          </div>
        </FadeIn>

      </main>
    </div>
  );
}

// ─── Section parsing ───────────────────────────────────────────────────────

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
      // skip
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0 || currentHeading) {
    result.push({ heading: currentHeading, lines: currentLines });
  }
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

function renderSectionLine(
  line: string,
  type: SectionType,
  key: number,
  style: (typeof SECTION_STYLES)[SectionType]
): React.ReactNode {
  const trimmed = line.trim();
  if (!trimmed) return null;

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

  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    return (
      <div key={key} className="flex gap-3 items-start">
        <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
        <p className="text-sm text-gray-700 leading-relaxed flex-1">{renderInline(trimmed.slice(2))}</p>
      </div>
    );
  }

  if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
    return (
      <p key={key} className="text-sm font-semibold text-gray-900">{trimmed.slice(2, -2)}</p>
    );
  }

  return (
    <p key={key} className="text-sm text-gray-700 leading-relaxed">{renderInline(trimmed)}</p>
  );
}

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
