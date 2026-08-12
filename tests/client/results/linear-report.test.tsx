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
  it("minden fejezetet egyszerre, olvasási sorrendben tart a dokumentumban", () => {
    render(<LinearReport sections={SECTIONS} locale="hu" onBack={vi.fn()} />);

    expect(screen.getByText("Áttekintés tartalma")).toBeInTheDocument();
    expect(screen.getByText("Dimenziók tartalma")).toBeInTheDocument();
    expect(screen.getByText("Munkastílus tartalma")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a tartalomjegyzék a kiválasztott szekcióhoz görget", async () => {
    const scrollIntoView = vi.fn();
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
    await userEvent.click(screen.getByRole("button", { name: /02\s*Dimenziók/ }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(onSectionOpen).toHaveBeenCalledWith("dimensions");
  });

  it("egyetlen visszalépéssel visszavisz az összképhez", async () => {
    const onBack = vi.fn();
    render(<LinearReport sections={SECTIONS} locale="hu" onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "Vissza az összképhez" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
