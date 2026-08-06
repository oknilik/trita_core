/**
 * TabViewTracker — a fül-mérés szerződése (Vitest + RTL).
 *
 * Amit rögzítünk:
 *  - a KEZDŐ fül is eseményt küld (nem csak a kattintás),
 *  - ugyanaz a (felület, fül) pár újrarendereléskor NEM duplikál,
 *  - fül-váltásra új esemény megy,
 *  - a felület váltása is új esemény (ugyanazzal a fül-névvel is).
 */

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A `vi.mock` a fájl tetejére emelődik, ezért a mock-függvényt is hoistolni
// kell (`vi.hoisted`) — különben a factory a még inicializálatlan változót
// olvasná.
const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@/lib/analytics/client", () => ({ track: trackMock }));

import { TabViewTracker } from "@/components/analytics/TabViewTracker";

describe("TabViewTracker", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("a kezdő fület is méri", () => {
    render(<TabViewTracker surface="results" tab="results" />);
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("surface.tab_view", {
      surface: "results",
      tab: "results",
    });
  });

  it("azonos fül újrarenderelése nem duplikál", () => {
    const { rerender } = render(<TabViewTracker surface="org" tab="teams" />);
    rerender(<TabViewTracker surface="org" tab="teams" />);
    rerender(<TabViewTracker surface="org" tab="teams" />);
    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it("fül-váltásra új eseményt küld", () => {
    const { rerender } = render(<TabViewTracker surface="team" tab="overview" />);
    rerender(<TabViewTracker surface="team" tab="intelligence" />);
    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock).toHaveBeenLastCalledWith("surface.tab_view", {
      surface: "team",
      tab: "intelligence",
    });
  });

  it("a felület váltása is új esemény", () => {
    const { rerender } = render(<TabViewTracker surface="team" tab="overview" />);
    rerender(<TabViewTracker surface="org" tab="overview" />);
    expect(trackMock).toHaveBeenCalledTimes(2);
  });

  it("nem renderel DOM-ot", () => {
    const { container } = render(<TabViewTracker surface="results" tab="comparison" />);
    expect(container.innerHTML).toBe("");
  });
});
