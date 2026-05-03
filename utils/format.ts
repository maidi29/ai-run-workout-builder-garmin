/**
 * Shared formatting utilities used across multiple screens.
 */

/** Format seconds into "m:ss" (e.g. 330 → "5:30") */
export function formatDuration(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}:${s.toString().padStart(2, "0")}`;
}

/** Format seconds into human-readable duration (e.g. 3600 → "1h", 5400 → "1h 30min") */
export function formatDurationFromSeconds(sec: number): string {
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Format minutes into human-readable duration (e.g. 90 → "1h 30min") */
export function formatDurationFromMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Format km distance into display string (e.g. 0.4 → "400 m", 5.5 → "5.50 km") */
export function formatDistanceDisplay(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(2)} km`;
}

/** Format a YYYY-MM-DD date string into human-readable display */
export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Get today's date as YYYY-MM-DD */
export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
