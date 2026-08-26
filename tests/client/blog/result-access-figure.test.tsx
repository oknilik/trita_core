import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { render, screen } from "@testing-library/react";
import { compileMDX } from "next-mdx-remote/rsc";
import { describe, expect, it } from "vitest";
import { ResultAccessFigure } from "@/components/blog/ResultAccessFigure";

function PassThrough({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

describe("ResultAccessFigure", () => {
  it("a tényleges hozzáférési rend mindhárom szereplőjét megjeleníti", () => {
    render(<ResultAccessFigure locale="hu" />);

    expect(screen.getByText("A résztvevő")).toBeInTheDocument();
    expect(screen.getByText("A csapat és a vezető")).toBeInTheDocument();
    expect(screen.getByText("A tanácsadó")).toBeInTheDocument();
    expect(screen.getByText(/Más csapattag egyéni eredményét nem látják/)).toBeInTheDocument();
  });

  it.each([
    ["pszichometriai-ertekeles-bevezetese.mdx", "hu", "A résztvevő"],
    ["introducing-psychometric-assessment.mdx", "en", "The participant"],
  ])("prerendereli a %s cikk hozzáférési blokkját", async (file, locale, role) => {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/blog", file), "utf8");
    const { content: source } = matter(raw);
    const { content } = await compileMDX({
      source,
      components: {
        Callout: PassThrough,
        KeyInsight: PassThrough,
        StatCard: PassThrough,
        StatRow: PassThrough,
        ResultAccessFigure,
      },
    });

    render(content);

    expect(screen.getByText(role)).toBeInTheDocument();
    expect(screen.getAllByRole("term")).toHaveLength(3);
    expect(screen.getAllByRole("definition")).toHaveLength(3);
    expect(screen.queryByText("Ki fér hozzá?")).not.toBeInTheDocument();
    expect(locale === "hu" ? screen.getByText("A tanácsadó") : screen.getByText("The consultant")).toBeInTheDocument();
  });
});
