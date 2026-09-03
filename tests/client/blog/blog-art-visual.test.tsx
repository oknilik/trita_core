import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";

describe("BlogArtVisual", () => {
  it("a négy család különböző, de determinisztikus SVG-t ad", () => {
    const common = {
      slug: "csapat-szemelyisegkep-ertelmezese",
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
    const collage = render(<BlogArtVisual {...common} family="collage" />);
    expect(modular.container.innerHTML).not.toBe(firstMarkup);
    expect(flow.container.innerHTML).not.toBe(firstMarkup);
    expect(collage.container.innerHTML).not.toBe(firstMarkup);
    expect(flow.container.innerHTML).not.toBe(modular.container.innerHTML);
    expect(collage.container.innerHTML).not.toBe(modular.container.innerHTML);
  });

  it("az azonos seedű fordításpár ugyanazt a szerkesztői képet kapja", () => {
    const hu = render(
      <BlogArtVisual
        slug="belso-mobilitas-a-megtartas-csendes-fegyvere"
        family="flow"
        concept="growth"
        lineMode="expressive"
        seed={1847}
      />,
    );
    const en = render(
      <BlogArtVisual
        slug="internal-mobility-quiet-retention-weapon"
        family="flow"
        concept="growth"
        lineMode="expressive"
        seed={1847}
      />,
    );
    expect(en.container.innerHTML).toBe(hu.container.innerHTML);
  });

  it("a vonalmentes mód minden dekoratív tintavonalat eltávolít", () => {
    for (const family of ["collage", "modular", "constellation", "flow"] as const) {
      const { container, unmount } = render(
        <BlogArtVisual
          slug={`vonalmentes-${family}`}
          family={family}
          concept="connection"
          lineMode="none"
          seed={12}
        />,
      );
      expect(container.querySelector("line")).not.toBeInTheDocument();
      expect(container.querySelector('path[fill="none"]')).not.toBeInTheDocument();
      unmount();
    }
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
