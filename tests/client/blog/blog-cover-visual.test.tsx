import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogCoverVisual } from "@/components/blog/BlogCoverVisual";

/**
 * A borító EGY belépőn megy ki minden felületre (lista, cikkfejléc, OG,
 * hírlevél). A szerződés: feltöltött kép esetén az megy, enélkül a generatív
 * vizuál — így a kettő nem csúszhat el egymástól felületenként.
 */
describe("BlogCoverVisual", () => {
  it("feltoltott boritonal a kepet rajzolja", () => {
    const { container } = render(
      <BlogCoverVisual
        coverImage="/blog-covers/csapatdinamika.jpg"
        slug="csapatdinamika"
        title="Csapatdinamika olvasása"
      />,
    );

    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    expect(image?.getAttribute("src")).toContain("csapatdinamika.jpg");
    // Dekoratív: a cím minden hívóhelyen ott áll mellette.
    expect(image?.getAttribute("alt")).toBe("");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("borito nelkul a generativ vizual megy", () => {
    const { container } = render(
      <BlogCoverVisual slug="csapatdinamika" title="Csapatdinamika olvasása" />,
    );

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("ures string nem szamit boritonak", () => {
    const { container } = render(<BlogCoverVisual coverImage="" slug="cikk" title="Cikk" />);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
