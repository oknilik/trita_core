import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  LinearReport,
  type LinearReportSection,
} from "@/components/results/LinearReport";

const SECTIONS: LinearReportSection[] = [
  { id: "overview", title: "Áttekintés", question: "Milyen mintázat?", description: "Első fejezet", content: <p>Áttekintés tartalma</p> },
  { id: "dimensions", title: "Dimenziók", question: "Mi van mögötte?", description: "Második fejezet", content: <p>Dimenziók tartalma</p> },
  { id: "workstyle", title: "Munkastílus és fejlődés", question: "Hogyan használd?", description: "Harmadik fejezet", content: <p>Munkastílus tartalma</p> },
];

describe("LinearReport", () => {
  it("elsőre egyetlen fejezetet nyit ki, a többi összefoglalóját láthatóan tartja", () => {
    render(<LinearReport sections={SECTIONS} locale="hu" onBack={vi.fn()} />);

    expect(screen.getByText("Áttekintés tartalma")).toBeInTheDocument();
    expect(screen.queryByText("Dimenziók tartalma")).toBeNull();
    expect(screen.queryByText("Munkastílus tartalma")).toBeNull();
    expect(screen.getByRole("button", { name: "02. Dimenziók — Megnyitás" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a kártyák közötti váltáskor pontosan egy fejezetet tart nyitva", async () => {
    const scrollIntoView = vi.fn();
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const onSectionOpen = vi.fn();

    render(
      <LinearReport
        sections={SECTIONS}
        locale="hu"
        onBack={vi.fn()}
        onSectionOpen={onSectionOpen}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "02. Dimenziók — Megnyitás" }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(onSectionOpen).toHaveBeenCalledWith("dimensions");
    expect(screen.queryByText("Áttekintés tartalma")).toBeNull();
    expect(screen.getByText("Dimenziók tartalma")).toBeInTheDocument();
    expect(screen.queryByText("Munkastílus tartalma")).toBeNull();
    requestAnimationFrame.mockRestore();
  });

  it("a mélylinkből választott fejezetet nyitja meg elsőként", () => {
    render(
      <LinearReport
        sections={SECTIONS}
        initialSection="workstyle"
        locale="hu"
        onBack={vi.fn()}
      />,
    );

    expect(screen.queryByText("Áttekintés tartalma")).toBeNull();
    expect(screen.getByText("Munkastílus tartalma")).toBeInTheDocument();
  });

  it("egyetlen visszalépéssel visszavisz az összképhez", async () => {
    const onBack = vi.fn();
    render(<LinearReport sections={SECTIONS} locale="hu" onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "Vissza az összképhez" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
