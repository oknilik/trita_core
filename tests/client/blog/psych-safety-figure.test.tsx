import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { render, screen } from "@testing-library/react";
import { compileMDX } from "next-mdx-remote/rsc";
import { describe, expect, it } from "vitest";
import { PsychSafetyFigure } from "@/components/blog/PsychSafetyFigure";
import { PSYCH_SAFETY_ITEMS, PSYCH_SAFETY_MIN_RESPONSES } from "@/lib/psych-safety";

function PassThrough({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

describe("PsychSafetyFigure", () => {
  it("a csapatindexet és a sávot mutatja, egyéni válasz nélkül", () => {
    const { container } = render(<PsychSafetyFigure locale="hu" />);

    expect(screen.getByText("Pszichológiai biztonság pulse")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText(/közepes/)).toBeInTheDocument();
    // Az itemek SZÖVEGE sosem kerül ki: az ábra területcímkéket mutat.
    for (const item of PSYCH_SAFETY_ITEMS) {
      expect(container.textContent).not.toContain(item.text.hu);
    }
  });

  it("kimondja az anonimitási küszöböt, a termékből vett értékkel", () => {
    render(<PsychSafetyFigure locale="hu" />);
    expect(
      screen.getByText(new RegExp(`csak ${PSYCH_SAFETY_MIN_RESPONSES} választól`)),
    ).toBeInTheDocument();
  });

  it("a területcímkék a termék kérdéskészletéből jönnek", () => {
    render(<PsychSafetyFigure locale="en" />);
    // Ha a lib átnevezi egy terület címkéjét, ez a teszt bukik – az ábra
    // nem csúszhat el a valódi mérés szótárától.
    const raising = PSYCH_SAFETY_ITEMS.find((i) => i.id === "PS1")!;
    expect(screen.getByText(raising.area.en)).toBeInTheDocument();
  });

  it.each([
    ["merheto-e-a-pszichologiai-biztonsag.mdx", "Pszichológiai biztonság pulse"],
    ["can-psychological-safety-be-measured.mdx", "Psychological safety pulse"],
  ])("prerendereli a %s cikk riport-szeletét", async (file, title) => {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/blog", file), "utf8");
    const { content: source } = matter(raw);
    const names = new Set([...source.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]));
    const components: Record<string, unknown> = {};
    for (const name of names) components[name] = PassThrough;
    components.PsychSafetyFigure = PsychSafetyFigure;

    const { content } = await compileMDX({ source, components: components as never });
    render(content);

    expect(screen.getByText(title)).toBeInTheDocument();
  });
});
