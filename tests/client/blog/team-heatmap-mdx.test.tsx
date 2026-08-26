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

describe("TeamReportFigure MDX contract", () => {
  it.each([
    ["egy-csapat-egy-hoterkep.mdx", "Aggregált csapatprofil", "Csapatátlag"],
    ["one-team-one-heatmap.mdx", "Aggregate team profile", "Team average"],
  ])("prerendereli a %s cikk beágyazott aggregált riportábráját", async (file, title, averageLabel) => {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/blog", file), "utf8");
    const { content: source } = matter(raw);
    const { content } = await compileMDX({
      source,
      components: {
        Callout: PassThrough,
        KeyInsight: PassThrough,
        TeamReportFigure,
      },
    });

    render(content);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`${averageLabel}:`)).length).toBeGreaterThan(0);
    expect(screen.queryByText("Anna")).not.toBeInTheDocument();
  });
});
