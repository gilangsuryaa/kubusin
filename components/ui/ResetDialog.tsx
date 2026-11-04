"use client";

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
          Reset kubus?
        </h2>
        <p id="reset-desc" className="mt-2 text-xs leading-relaxed text-ink-soft">
          Kubus kembali ke kondisi selesai. Langkah dan waktu saat ini hilang,
          tetapi daftar rekor terbaik tetap tersimpan.
        </p>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-autofocus="true"
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1"
          >
            Ya, reset
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
