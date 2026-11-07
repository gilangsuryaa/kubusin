"use client";

import { useCallback } from "react";
import {
  translate,
  type Locale,
  type MessageKey,
  type TFunction,
  type Vars,
} from "@/lib/i18n";
import { useGameStore } from "@/store/game";

/** The active UI locale, reactive to the store. */
export function useLocale(): Locale {
  return useGameStore((state) => state.locale);
}

/** A translator bound to the active locale; re-created when it changes. */
export function useT(): TFunction {
  const locale = useLocale();
  return useCallback(
    (key: MessageKey, vars?: Vars) => translate(locale, key, vars),
    [locale],
  );
}
