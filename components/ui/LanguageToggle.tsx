"use client";

import { useT } from "@/hooks/useT";
import { otherLocale } from "@/lib/i18n";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

/**
 * Two-state language switch, mirroring the theme toggle: it shows the active
 * language and flips to the other on press. The choice persists on the device.
 */
export function LanguageToggle() {
  const locale = useGameStore((state) => state.locale);
  const setLocale = useGameStore((state) => state.setLocale);
  const t = useT();

  const english = locale === "en";
  const action = english
    ? t("lang.switchToIndonesian")
    : t("lang.switchToEnglish");

  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0 text-xs font-semibold"
      role="switch"
      aria-checked={english}
      aria-label={t("lang.aria")}
      title={action}
      onClick={() => setLocale(otherLocale(locale))}
    >
      <span aria-hidden="true">{english ? "EN" : "ID"}</span>
    </Button>
  );
}
