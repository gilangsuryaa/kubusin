"use client";

import { formatDate, formatTime } from "@/lib/format";
import { useGameStore } from "@/store/game";

export function BestTimes() {
  const bestTimes = useGameStore((state) => state.bestTimes);
  const hydrated = useGameStore((state) => state.hydrated);

  return (
    <section aria-label="Waktu terbaik" className="border-t border-line pt-4">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        Rekor terbaik
      </h2>

      {!hydrated ? (
        <ul className="mt-3 space-y-2" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li key={index} className="h-4 w-full max-w-[180px] bg-ink/[0.07]" />
          ))}
        </ul>
      ) : bestTimes.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Belum ada catatan. Tekan Spasi untuk mengacak, lalu selesaikan kubus.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-line">
          {bestTimes.map((entry, index) => (
            <li
              key={entry.id}
              className="tnum flex items-baseline gap-3 py-1.5 text-sm"
            >
              <span className="w-5 shrink-0 text-xs text-ink-soft">{index + 1}</span>
              <span className="font-medium">{formatTime(entry.ms)}</span>
              <span className="text-xs text-ink-soft">{entry.moves} langkah</span>
              <span className="ml-auto hidden text-[11px] text-ink-soft sm:block">
                {formatDate(entry.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
