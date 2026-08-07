"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  normalizeTheme,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

// A séma-választás állapota.
//
// A kezdőértéket NEM itt olvassuk ki mountkor: a THEME_INIT_SCRIPT már a
// festés előtt ráírta a <html data-theme>-re, itt csak követjük. Az állapot
// két KÜLSŐ forrásból jön (süti + prefers-color-scheme), ezért
// useSyncExternalStore — így nincs setState-effect, és a hidratálás is
// helyes (a szerver-pillanatkép az alapértelmezés).

interface ThemeContextValue {
  /** Amit a felhasználó választott — a "system" is választás. */
  preference: ThemePreference;
  /** Amit ténylegesen látunk. */
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DARK_QUERY = "(prefers-color-scheme: dark)";
const SERVER_SNAPSHOT = `${DEFAULT_THEME}|light`;

const listeners = new Set<() => void>();

function readCookie(): ThemePreference {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`));
  return normalizeTheme(match ? decodeURIComponent(match[1]) : null);
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Sztring-pillanatkép: a useSyncExternalStore referencia-azonosságot vár. */
function getSnapshot(): string {
  return `${readCookie()}|${systemTheme()}`;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const query = window.matchMedia?.(DARK_QUERY);
  query?.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    query?.removeEventListener("change", onChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const [rawPreference, rawSystem] = snapshot.split("|");
  const preference = normalizeTheme(rawPreference);
  const resolved: ResolvedTheme =
    preference === "system" ? (rawSystem === "dark" ? "dark" : "light") : preference;

  // A <html data-theme> a forrásigazság a CSS felé. Ez valódi DOM-mellékhatás.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    document.cookie =
      `${THEME_COOKIE}=${encodeURIComponent(next)};path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax`;
    for (const listener of listeners) listener();
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme csak ThemeProvider alatt használható");
  }
  return context;
}
