import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useProfileNavigation } from "@/components/profile/useProfileNavigation";

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
