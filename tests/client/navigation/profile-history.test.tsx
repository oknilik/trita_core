import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileNavigation } from "@/components/profile/useProfileNavigation";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

beforeEach(() => window.history.replaceState(null, "", "/profile/results"));

describe("personal report navigation", () => {
  it("restores views and chapters with browser Back and Forward", async () => {
    const { result } = renderHook(() => useProfileNavigation("summary", "overview"));
    act(() => result.current.navigate("details"));
    act(() => result.current.navigate("details", "dimensions"));
    expect(result.current.activeChapter).toBe("dimensions");
    act(() => window.history.back());
    await waitFor(() => expect(result.current.activeChapter).toBe("overview"));
    expect(result.current.activeTab).toBe("details");
    act(() => window.history.back());
    await waitFor(() => expect(result.current.activeTab).toBe("summary"));
    act(() => window.history.forward());
    await waitFor(() => expect(result.current.activeTab).toBe("details"));
  });
  it("follows a same-page Next Link query change without popstate or changed initial props", () => {
    const { result, rerender } = renderHook(() => useProfileNavigation("summary", "overview"));
    act(() => result.current.navigate("details", "dimensions"));
    expect(result.current.activeTab).toBe("details");
    expect(result.current.activeChapter).toBe("dimensions");
    // App Router changes its search-param context; native pushState emits no popstate.
    act(() => window.history.pushState(null, "", "/profile/results"));
    rerender();
    expect(result.current.activeTab).toBe("summary");
    expect(result.current.activeChapter).toBe("overview");
    act(() => window.history.pushState(null, "", "/profile/results?tab=comparison"));
    rerender();
    expect(result.current.activeTab).toBe("comparison");
  });

  it("does not create duplicate entries and preserves unrelated query parameters", () => {
    window.history.replaceState(null, "", "/profile/results?retake=true#observer-flow");
    const { result } = renderHook(() => useProfileNavigation("summary", "overview"));
    act(() => result.current.navigate("comparison"));
    expect(window.location.search).toBe("?retake=true&tab=comparison");
    expect(window.location.hash).toBe("");
    const length = window.history.length;
    act(() => result.current.navigate("comparison"));
    expect(window.history.length).toBe(length);
  });
});
