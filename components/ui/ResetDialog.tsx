"use client";

import { useT } from "@/hooks/useT";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ResetDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation shown before a reset. Reset is destructive to the current run,
 * so the dialog spells out what is lost and focuses the safe choice by default.
 */
export function ResetDialog({ open, onCancel, onConfirm }: ResetDialogProps) {
  const t = useT();
  return (
    <Dialog
      open={open}
      labelledBy="reset-title"
      describedBy="reset-desc"
      onClose={onCancel}
      panelClassName="max-w-sm"
    >
      <div className="p-5 sm:p-6">
        <h2 id="reset-title" className="text-xl font-semibold tracking-tight">
          {t("reset.title")}
        </h2>
        <p id="reset-desc" className="mt-2 text-xs leading-relaxed text-ink-soft">
          {t("reset.desc")}
        </p>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-autofocus="true"
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1"
          >
            {t("reset.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
