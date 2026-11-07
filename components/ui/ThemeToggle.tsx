"use client";

import { useEffect } from "react";
import { useT } from "@/hooks/useT";
import {
  applyThemeColor,
  useResolvedTheme,
  useThemeToggle,
} from "@/hooks/useTheme";
import { Button } from "./Button";

/** Sun and moon are the conventional glyphs for a light/dark switch. */
function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
      <circle
        cx="10"
        cy="10"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
      <path
        d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Explicit light/dark switch. Without a stored choice the page follows the
 * system; the first press pins the opposite of whatever is showing.
 */
export function ThemeToggle() {
  const t = useT();
  const theme = useResolvedTheme();
  const toggle = useThemeToggle();
  const dark = theme === "dark";
  const action = dark ? t("theme.switchToLight") : t("theme.switchToDark");

  // The stored choice can disagree with the system meta colour on first paint.
  useEffect(() => {
    applyThemeColor(theme);
  }, [theme]);

  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0"
      role="switch"
      aria-checked={dark}
      aria-label={t("theme.darkAria")}
      title={action}
      onClick={toggle}
    >
      {dark ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}