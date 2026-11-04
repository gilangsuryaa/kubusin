/** Format milliseconds as `ss.cc` or `m:ss.cc`. */
export function formatTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return "0.00";
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return minutes > 0
    ? `${minutes}:${pad(seconds)}.${pad(centis)}`
    : `${seconds}.${pad(centis)}`;
}

/** Indonesian plural free counter, e.g. "12 langkah". */
export function formatMoves(count: number): string {
  return `${count} langkah`;
}

export function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}
