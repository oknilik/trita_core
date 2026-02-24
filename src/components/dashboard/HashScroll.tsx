"use client";

import { useEffect } from "react";

// Hash targets can be inside tab panels and may render after client-side tab activation.
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 100;

function scrollToHashTarget() {
  const hash = window.location.hash;
  if (!hash) return false;

  const target = document.getElementById(hash.slice(1));
  if (!target) return false;

  target.scrollIntoView({ block: "start" });
  return true;
}

export function HashScroll() {
  useEffect(() => {
    let retries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryScroll = () => {
      const done = scrollToHashTarget();
      if (done || retries >= MAX_RETRIES) return;
      retries += 1;
      timer = setTimeout(tryScroll, RETRY_DELAY_MS);
    };

    tryScroll();

    const onHashChange = () => {
      retries = 0;
      if (timer) clearTimeout(timer);
      tryScroll();
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}
