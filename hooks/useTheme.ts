"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

/** Stored key. Absent means "follow the system". */
export const THEME_STORAGE_KEY = "kubusin.theme.v1";

/** Same event the inline boot script uses, kept in sync in one place. */
const THEME_EVENT = "kubusin:theme";

const THEME_COLOR: Record<Theme, string> = {
  light: "#f4f2ed",
  dark: "#121110",
};

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** Explicit choice on <html> wins, otherwise the system preference. */
function readTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Keep the browser chrome colour in step with the chosen theme. */
export function applyThemeColor(theme: Theme): void {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.removeAttribute("media");
      meta.content = THEME_COLOR[theme];
    });
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    // A stored choice freezes the theme, so ignore system flips then.
    if (storedTheme() === null) onChange();
  };
  media.addEventListener("change", onSystemChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

/** The theme actually in effect, reactive to both the choice and the system. */
export function useResolvedTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    readTheme,
    // The server has no access to the device, so it renders the light tokens;
    // hydration swaps to the real value without a mismatch.
    () => "light",
  );
}

/** Class that enables the theme cross-fade in globals.css. */
const SWITCH_CLASS = "theme-switching";
/** A touch longer than the 280ms CSS transition so it never gets cut short. */
const SWITCH_MS = 320;

let switchTimer: number | null = null;

/**
 * Turn on colour transitions just for the flip. Removing the class afterwards
 * keeps the transition from leaking into hover, focus, and layout changes.
 */
function beginThemeTransition(): void {
  const root = document.documentElement;
  root.classList.add(SWITCH_CLASS);
  if (switchTimer !== null) window.clearTimeout(switchTimer);
  switchTimer = window.setTimeout(() => {
    root.classList.remove(SWITCH_CLASS);
    switchTimer = null;
  }, SWITCH_MS);
}

/** Flip between the two modes. The choice persists and overrides the system. */
export function useThemeToggle(): () => void {
  const theme = useResolvedTheme();
  return useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    beginThemeTransition();
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the attribute still applies for this session.
    }
    applyThemeColor(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [theme]);
}
