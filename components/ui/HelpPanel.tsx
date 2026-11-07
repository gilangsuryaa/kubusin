"use client";

import type { ReactNode } from "react";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { ColorLegend } from "./ColorLegend";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

function Keys({ children }: { children: ReactNode }) {
  return <span className="flex flex-wrap items-center gap-1">{children}</span>;
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[3px] border border-line-strong bg-bg-elev px-1.5 py-0.5 text-[11px] font-medium text-ink">
      {children}
    </kbd>
  );
}

/** A keycap is either a literal key name or a translated word. */
type Keycap = string | { text: MessageKey };

interface HelpRow {
  readonly keys: readonly Keycap[];
  readonly description: MessageKey;
}

const KEY_ROWS: readonly HelpRow[] = [
  {
    keys: ["U", "D", "L", "R", "F", "B"],
    description: "help.row.faceCw",
  },
  {
    keys: ["Shift", { text: "help.key.letter" }],
    description: "help.row.faceCcw",
  },
  {
    keys: ["M", "E", "S"],
    description: "help.row.middle",
  },
  {
    keys: ["Shift", { text: "help.key.middle" }],
    description: "help.row.middleCcw",
  },
  {
    keys: ["W"],
    description: "help.row.wide",
  },
  {
    keys: ["x", "y", "z"],
    description: "help.row.cube",
  },
  {
    keys: ["Shift", { text: "help.key.cube" }],
    description: "help.row.cubeCcw",
  },
  {
    keys: ["←", "↑", "→", "↓"],
    description: "help.row.camera",
  },
  {
    keys: [{ text: "help.key.space" }],
    description: "help.row.scramble",
  },
  {
    keys: ["Backspace"],
    description: "help.row.undo",
  },
  {
    keys: ["Enter"],
    description: "help.row.reset",
  },
  {
    keys: ["?"],
    description: "help.row.help",
  },
];

const POINTER_ROWS: readonly HelpRow[] = [
  {
    keys: [{ text: "help.pointer.drag" }],
    description: "help.pointer.dragDesc",
  },
  {
    keys: [{ text: "help.pointer.scroll" }],
    description: "help.pointer.scrollDesc",
  },
  {
    keys: [{ text: "help.pointer.pinch" }],
    description: "help.pointer.pinchDesc",
  },
];

export function HelpPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const renderKey = (key: Keycap) =>
    typeof key === "string" ? key : t(key.text);

  return (
    <Dialog open={open} labelledBy="help-title" onClose={onClose}>
      <div className="max-h-[82vh] overflow-y-auto p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
              {t("help.eyebrow")}
            </p>
            <h2 id="help-title" className="mt-1 text-xl font-semibold tracking-tight">
              {t("help.title")}
            </h2>
          </div>
          <Button
            variant="bare"
            size="icon"
            onClick={onClose}
            aria-label={t("help.closeAria")}
            data-autofocus="true"
          >
            <span aria-hidden="true">✕</span>
          </Button>
        </header>

        <dl className="mt-5 divide-y divide-line">
          {KEY_ROWS.map((row) => (
            <div key={row.description} className="flex items-baseline gap-4 py-2.5">
              <dt className="shrink-0">
                <Keys>
                  {row.keys.map((key, index) => (
                    <Key key={index}>{renderKey(key)}</Key>
                  ))}
                </Keys>
              </dt>
              <dd className="text-xs text-ink-soft">{t(row.description)}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          {t("help.rules")}
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          {t("help.guide")}
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          {t("help.tracker")}
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          {t("help.sound")}
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          {t("help.orientation")}
        </p>

        <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          {t("help.mouseTouch")}
        </h3>
        <dl className="mt-2 divide-y divide-line">
          {POINTER_ROWS.map((row) => (
            <div key={row.description} className="flex items-baseline gap-4 py-2.5">
              <dt className="w-16 shrink-0 text-xs font-medium">
                {renderKey(row.keys[0])}
              </dt>
              <dd className="text-xs text-ink-soft">{t(row.description)}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          {t("help.lettersColors")}
        </h3>
        <ColorLegend className="mt-3" />
        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          {t("help.legend")}
        </p>
      </div>
    </Dialog>
  );
}
