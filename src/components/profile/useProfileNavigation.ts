"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ProfileViewId, ReportChapterId } from "./ProfileTabs";

function readLocation(query = window.location.search) {
  const params = new URLSearchParams(query);
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
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [location, setLocation] = useState({ activeTab: initialTab, activeChapter: initialChapter });
  const [previousQuery, setPreviousQuery] = useState(query);
  useEffect(() => {
    const restore = () => setLocation(readLocation());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  // Next Link/router navigation updates search params without a popstate event.
  // The component may remain mounted with the same initial props (e.g. the
  // header's My results link), so those props cannot be the synchronization key.
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setLocation(readLocation(query));
  }

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
