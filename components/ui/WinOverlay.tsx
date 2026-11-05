"use client";

import { formatTime } from "@/lib/format";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface WinOverlayProps {
  open: boolean;
  ms: number | null;
  moves: number;
  /** Best time including this run, or null when there is no history yet. */
  bestMs: number | null;
  isNewBest: boolean;
  /** False when the guide was on, so the time was not stored as a record. */
  recorded: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function WinOverlay({
  open,
  ms,
  moves,
  bestMs,
  isNewBest,
  recorded,
  onPlayAgain,
  onClose,
}: WinOverlayProps) {
  return (
    <Dialog
      open={open}
      labelledBy="win-title"
      onClose={onClose}
      panelClassName="max-w-sm"
    >
      <div className="p-5 sm:p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
          Kubus selesai
        </p>
        <h2 id="win-title" className="mt-2 text-2xl font-semibold tracking-tight">
          {isNewBest ? "Rekor baru." : "Kubus kembali utuh."}
        </h2>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-line py-4">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Waktu
            </dt>
            <dd className="tnum mt-1 text-2xl font-semibold tracking-tight">
              {formatTime(ms)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Langkah
            </dt>
            <dd className="tnum mt-1 text-2xl font-semibold tracking-tight">
              {moves}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-ink-soft">
          {!recorded
            ? "Mode panduan aktif, jadi waktu ini tidak masuk rekor."
            : isNewBest
              ? "Waktu ini tersimpan sebagai rekor terbaikmu."
              : bestMs !== null
                ? `Rekor terbaikmu ${formatTime(bestMs)}.`
                : "Waktu ini masuk ke daftar rekormu."}
        </p>

        <div className="mt-6 flex gap-2">
          <Button
            variant="primary"
            onClick={onPlayAgain}
            data-autofocus="true"
            className="flex-1"
          >
            Main lagi
          </Button>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
