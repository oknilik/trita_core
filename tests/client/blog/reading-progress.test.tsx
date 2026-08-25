import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadingProgress } from "@/components/blog/ReadingProgress";

describe("ReadingProgress", () => {
  it("a viewport tetején marad, nem a sticky header rétegében", () => {
    const { container } = render(<ReadingProgress />);
    const progress = container.firstElementChild;

    expect(progress).toHaveClass("fixed", "inset-x-0", "top-0", "z-[60]");
    expect(progress).not.toHaveClass("sticky");
  });
});
