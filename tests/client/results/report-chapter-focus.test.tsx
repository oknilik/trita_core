import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ReportChapterFocus,
  type ReportChapter,
} from "@/components/results/ReportChapterFocus";

const CHAPTERS: ReportChapter[] = [
  { id: "overview", title: "Áttekintés", description: "Első fejezet", content: <p>Áttekintés tartalma</p> },
  { id: "dimensions", title: "Dimenziók", description: "Második fejezet", content: <p>Dimenziók tartalma</p> },
  { id: "workstyle", title: "Munkastílus és fejlődés", description: "Harmadik fejezet", content: <p>Munkastílus tartalma</p> },
];

describe("ReportChapterFocus", () => {
  it("egyszerre pontosan egy fejezetet mutat, a többit a választóban tartja", async () => {
    const onChapterOpen = vi.fn();
    render(
      <ReportChapterFocus
        chapters={CHAPTERS}
        locale="hu"
        onChapterOpen={onChapterOpen}
      />,
    );

    expect(screen.getByText("Áttekintés tartalma")).toBeInTheDocument();
    expect(screen.queryByText("Dimenziók tartalma")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "1 / 3 · Fejezetek" }));
    await userEvent.click(screen.getByRole("button", { name: "02. Dimenziók" }));

    expect(screen.queryByText("Áttekintés tartalma")).toBeNull();
    expect(screen.getByText("Dimenziók tartalma")).toBeInTheDocument();
    expect(onChapterOpen).toHaveBeenCalledWith("dimensions");
  });

  it("a mélylinkből választott fejezetet nyitja meg elsőként", () => {
    render(
      <ReportChapterFocus
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

    render(<ReportChapterFocus chapters={CHAPTERS} locale="hu" />);
    await userEvent.click(screen.getByRole("button", { name: "Következő fejezet: Dimenziók" }));

    expect(screen.getByText("Dimenziók tartalma")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it("Escape-pel bezárja a fejezetválasztót és visszaadja a fókuszt", async () => {
    render(<ReportChapterFocus chapters={CHAPTERS} locale="hu" />);
    const pickerButton = screen.getByRole("button", { name: "1 / 3 · Fejezetek" });

    await userEvent.click(pickerButton);
    expect(screen.getByRole("dialog", { name: "Riport fejezetei" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Riport fejezetei" })).toBeNull();
    expect(pickerButton).toHaveFocus();
  });
});
