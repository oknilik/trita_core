"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { SkeletonLoader } from "@/components/SkeletonLoader";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isChanging: boolean;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualUpdateAtRef = useRef(0);
  const [locale, setLocaleState] = useState<Locale>(() =>
    normalizeLocale(initialLocale ?? DEFAULT_LOCALE)
  );
  const [isChanging, setIsChanging] = useState(false);

  const applyLocale = useCallback((next: Locale) => {
    setLocaleState((prev) => (prev === next ? prev : next));
    if (typeof window !== "undefined") {
      document.cookie = `trita_locale=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
      window.localStorage.setItem("trita_locale", next);
      document.documentElement.lang = next;
    }
  }, []);

  const refreshServer = useCallback(() => {
    if (typeof window === "undefined") return;
    if (refreshTimerRef.current !== null) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      startTransition(() => {
        router.refresh();
      });
    }, 0);
  }, [router, startTransition]);

  useEffect(() => {
    const localValue = window.localStorage.getItem("trita_locale");
    const localLocale = normalizeLocale(localValue);
    if (localValue && localLocale !== locale) {
      const timer = setTimeout(() => {
        applyLocale(localLocale);
        refreshServer();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [applyLocale, locale, refreshServer]);

  useEffect(() => {
    const hasLocalLocale = window.localStorage.getItem("trita_locale");
    if (hasLocalLocale) return;
    const browserLocale = normalizeLocale(
      navigator.languages?.[0] ?? navigator.language
    );
    const next = browserLocale ?? locale;
    const timer = setTimeout(() => {
      applyLocale(next);
      if (next !== locale) refreshServer();
    }, 0);
    return () => clearTimeout(timer);
  }, [applyLocale, locale, refreshServer]);

  useEffect(() => {
    const startedAt = Date.now();
    let canceled = false;
    fetch("/api/profile/locale")
      .then((res) => res.json())
      .then((data) => {
        if (canceled || !data?.locale) return;
        if (manualUpdateAtRef.current > startedAt) return;
        const next = normalizeLocale(data.locale);
        const current = normalizeLocale(window.localStorage.getItem("trita_locale"));
        applyLocale(next);
        if (next !== current) refreshServer();
      })
      .catch(() => null);
    return () => {
      canceled = true;
    };
  }, [applyLocale, refreshServer]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const setLocale = (next: Locale) => {
    const normalized = normalizeLocale(next);
    if (normalized === locale) return;

    // Show loading state
    setIsChanging(true);

    manualUpdateAtRef.current = Date.now();
    applyLocale(normalized);
    fetch("/api/profile/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: normalized }),
    }).catch(() => null);
    refreshServer();

    // Hide loading state after transition
    setTimeout(() => setIsChanging(false), 500);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isChanging }}>
      {isChanging && <SkeletonLoader />}
      <div className={`md:transition-opacity md:duration-300 ${isChanging ? "md:opacity-0" : "md:opacity-100"}`}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
