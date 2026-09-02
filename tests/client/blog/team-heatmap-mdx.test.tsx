import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { render, screen } from "@testing-library/react";
import { compileMDX } from "next-mdx-remote/rsc";
import { describe, expect, it } from "vitest";
import { TeamReportFigure } from "@/components/blog/TeamReportFigure";

function PassThrough({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * A cikk BÁRMELY MDX-komponenst használhatja — ez a teszt csak a
 * TeamReportFigure szerződését őrzi. Ezért a forrásból szedjük ki a
 * használt komponensneveket, és mindet átengedjük; így egy új komponens
 * (DimBadge, StatRow, …) nem töri el a tesztet. A valódi komponens-map a
 * blogoldalon él: src/app/(marketing)/blog/[slug]/page.tsx
 */
function componentsFor(source: string, overrides: Record<string, unknown>) {
  const used = new Set(
    [...source.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]),
  );
  const map: Record<string, unknown> = {};
  for (const name of used) map[name] = PassThrough;
  return { ...map, ...overrides } as Record<
    string,
    React.ComponentType<{ children?: React.ReactNode }>
  >;
}

describe("TeamReportFigure MDX contract", () => {
  it.each([
    ["egy-csapat-egy-hoterkep.mdx", "Aggregált csapatprofil", "Csapatátlag"],
    ["one-team-one-heatmap.mdx", "Aggregate team profile", "Team average"],
  ])("prerendereli a %s cikk beágyazott aggregált riportábráját", async (file, title, averageLabel) => {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/blog", file), "utf8");
    const { content: source } = matter(raw);
    const { content } = await compileMDX({
      source,
      components: componentsFor(source, { TeamReportFigure }),
    });

    render(content);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${averageLabel}:`)).length).toBeGreaterThan(0);
    expect(screen.queryByText("Anna")).not.toBeInTheDocument();
  });
});
