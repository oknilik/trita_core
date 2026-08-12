import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReportChapterAccordion,
  type ReportChapter,
} from "@/components/results/ReportChapterAccordion";

const CHAPTERS: ReportChapter[] = [
  { id: "overview", title: "Áttekintés", description: "Első fejezet", content: <p>Áttekintés tartalma</p> },
  { id: "dimensions", title: "Dimenziók", description: "Második fejezet", content: <p>Dimenziók tartalma</p> },
  { id: "workstyle", title: "Munkastílus és fejlődés", description: "Harmadik fejezet", content: <p>Munkastílus tartalma</p> },
];

describe("ReportChapterAccordion", () => {
  it("egyszerre pontosan egy fejezetet tart nyitva", async () => {
    const onChapterOpen = vi.fn();
    render(
      <ReportChapterAccordion
        chapters={CHAPTERS}
        locale="hu"
        onChapterOpen={onChapterOpen}
      />,
    );

    expect(screen.getByText("Áttekintés tartalma")).toBeInTheDocument();
    expect(screen.queryByText("Dimenziók tartalma")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "2. Dimenziók — Megnyitás" }));

    expect(screen.queryByText("Áttekintés tartalma")).toBeNull();
    expect(screen.getByText("Dimenziók tartalma")).toBeInTheDocument();
    expect(onChapterOpen).toHaveBeenCalledWith("dimensions");
  });

  it("a mélylinkből választott fejezetet nyitja meg elsőként", () => {
    render(
      <ReportChapterAccordion
        chapters={CHAPTERS}
        initialChapter="workstyle"
        locale="hu"
      />,
    );

    expect(screen.getByText("Munkastílus tartalma")).toBeInTheDocument();
    expect(screen.queryByText("Áttekintés tartalma")).toBeNull();
  });

  it("a következő fejezet gomb lineárisan továbbvezet", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(<ReportChapterAccordion chapters={CHAPTERS} locale="hu" />);
    await userEvent.click(screen.getByRole("button", { name: "Következő fejezet: Dimenziók →" }));

    expect(screen.getByText("Dimenziók tartalma")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });
});
