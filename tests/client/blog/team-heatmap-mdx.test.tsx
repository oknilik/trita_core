import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { render, screen } from "@testing-library/react";
import { compileMDX } from "next-mdx-remote/rsc";
import { describe, expect, it } from "vitest";
import { TeamHeatmapFigure } from "@/components/blog/TeamHeatmapFigure";

function PassThrough({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

describe("TeamHeatmapFigure MDX contract", () => {
  it.each([
    ["egy-csapat-egy-hoterkep.mdx", "Csapattag", "magas"],
    ["one-team-one-heatmap.mdx", "Team member", "high"],
  ])("prerendereli a %s cikk beágyazott hőtérképét", async (file, memberLabel, highLabel) => {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/blog", file), "utf8");
    const { content: source } = matter(raw);
    const { content } = await compileMDX({
      source,
      components: {
        Callout: PassThrough,
        KeyInsight: PassThrough,
        TeamHeatmapFigure,
      },
    });

    render(content);

    expect(screen.getByText(memberLabel)).toBeInTheDocument();
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getAllByText(highLabel).length).toBeGreaterThan(0);
  });
});
