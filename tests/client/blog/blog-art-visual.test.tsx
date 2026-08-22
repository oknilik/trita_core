import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";

describe("BlogArtVisual", () => {
  it("a három család különböző, de determinisztikus SVG-t ad", () => {
    const common = {
      slug: "csapatdinamika-olvasasa",
      title: "A csapatdinamika olvasása",
      tags: ["csapatdinamika"],
      concept: "connection" as const,
      seed: 712,
      variant: "card" as const,
    };

    const constellation = render(<BlogArtVisual {...common} family="constellation" />);
    const firstMarkup = constellation.container.innerHTML;
    constellation.rerender(<BlogArtVisual {...common} family="constellation" />);
    expect(constellation.container.innerHTML).toBe(firstMarkup);

    const modular = render(<BlogArtVisual {...common} family="modular" />);
    const flow = render(<BlogArtVisual {...common} family="flow" />);
    expect(modular.container.innerHTML).not.toBe(firstMarkup);
    expect(flow.container.innerHTML).not.toBe(firstMarkup);
    expect(flow.container.innerHTML).not.toBe(modular.container.innerHTML);
  });

  it("dekorációként rejtett marad a képernyőolvasó elől", () => {
    const { container } = render(
      <BlogArtVisual slug="egy-cikk" family="flow" concept="growth" seed={11} />,
    );
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).not.toHaveAttribute("role", "img");
  });

  it("a régi explicit motívumot továbbra is kirajzolja", () => {
    const { container } = render(
      <BlogArtVisual slug="regi-cikk" motif="radar" seed={9} variant="card" />,
    );
    expect(container.querySelector("polygon")).toBeInTheDocument();
  });
});
