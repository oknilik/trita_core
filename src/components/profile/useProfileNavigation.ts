"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProfileViewId, ReportChapterId } from "./ProfileTabs";

function readLocation() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const chapter = params.get("chapter");
  const activeTab: ProfileViewId = tab === "comparison" || tab === "invites"
    ? "comparison"
    : tab === "details" || tab === "results" || tab === "workstyle" ? "details" : "summary";
  const activeChapter: ReportChapterId = tab === "workstyle" ? "workstyle"
    : chapter === "dimensions" || chapter === "workstyle" ? chapter : "overview";
  return { activeTab, activeChapter };
}

/** Native history keeps tab/chapter navigation local, and Back/Forward reversible. */
export function useProfileNavigation(initialTab: ProfileViewId, initialChapter: ReportChapterId) {
  const [location, setLocation] = useState({ activeTab: initialTab, activeChapter: initialChapter });
  useEffect(() => {
    const restore = () => setLocation(readLocation());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  const navigate = useCallback((tab: ProfileViewId, chapter?: ReportChapterId) => {
    const url = new URL(window.location.href);
    if (tab === "summary") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    if (tab === "details" && chapter) url.searchParams.set("chapter", chapter);
    else url.searchParams.delete("chapter");
    // An old section anchor must not scroll a different view unexpectedly.
    url.hash = "";
    if (url.href !== window.location.href) {
      window.history.pushState(null, "", url.pathname + url.search);
    }
    setLocation(readLocation());
  }, []);
  return { ...location, navigate };
}
