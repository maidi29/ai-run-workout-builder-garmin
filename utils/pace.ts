/**
 * Pace utilities for min/km format
 * Internal representation uses decimal min/km: 4:30/km = 4 + 30/60 = 4.5
 * Note: Garmin API uses m/s for pace targets — conversion happens in workoutService.
 */

/** Default seconds to add above/below pace when range not specified */
const DEFAULT_PACE_MARGIN_SEC = 5;

/**
 * Parses "4:30" or "3:40" style string to decimal minutes per km
 */
export function parsePaceToDecimal(paceStr: string | undefined): number | null {
  if (!paceStr || !paceStr.trim()) return null;
  const trimmed = paceStr.trim().replace(/\s*\/km$/i, "");
  const match = trimmed.match(/^(\d+):(\d{2})$/);
  if (!match) return null;
  const min = parseInt(match[1], 10);
  const sec = parseInt(match[2], 10);
  if (sec >= 60) return null;
  return min + sec / 60;
}

/**
 * Converts decimal minutes per km to "4:30" format
 */
export function decimalToPaceStr(decimal: number): string {
  const min = Math.floor(decimal);
  const sec = Math.round((decimal - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Parses "5:45-6:15" range format. Returns null if not a valid range.
 */
export function parsePaceRange(
  paceStr: string | undefined,
): { slower: number; faster: number } | null {
  if (!paceStr || !paceStr.trim()) return null;
  const trimmed = paceStr.trim().replace(/\s*\/km$/i, "");
  const rangeMatch = trimmed.match(/^(\d+):(\d{2})\s*-\s*(\d+):(\d{2})$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10) / 60;
    const b = parseInt(rangeMatch[3], 10) + parseInt(rangeMatch[4], 10) / 60;
    // Higher decimal = slower pace, lower decimal = faster pace
    const slower = Math.max(a, b);
    const faster = Math.min(a, b);
    return { slower, faster };
  }
  return null;
}

/**
 * Returns a pace range: [slowerDecimal, fasterDecimal] in decimal min/km.
 * If "X:XX-Y:YY" format: uses exact range. If single pace: adds ±margin.
 * Note: workoutService converts to m/s before sending to Garmin.
 */
export function paceToRange(
  paceStr: string | undefined,
  marginSec: number = DEFAULT_PACE_MARGIN_SEC,
): { slower: number; faster: number } | null {
  const range = parsePaceRange(paceStr);
  if (range) return range;
  const decimal = parsePaceToDecimal(paceStr);
  if (decimal == null) return null;
  const marginMin = marginSec / 60;
  return {
    slower: decimal + marginMin,
    faster: Math.max(0.1, decimal - marginMin),
  };
}

/**
 * Returns formatted pace range string for display: "(4:25-4:35 /km)"
 */
export function formatPaceRangeDisplay(
  paceStr: string | undefined,
  marginSec: number = DEFAULT_PACE_MARGIN_SEC,
): string | null {
  const range = paceToRange(paceStr, marginSec);
  if (!range) return null;
  const slowerStr = decimalToPaceStr(range.slower);
  const fasterStr = decimalToPaceStr(range.faster);
  return `(${fasterStr}-${slowerStr} /km)`;
}

/** Default pace when no value is provided (5:00/km) */
const DEFAULT_PACE_DECIMAL = 5;

/**
 * Adjusts a pace string (single or range) by deltaSec seconds.
 * Positive deltaSec = slower pace, negative = faster pace.
 */
export function adjustPace(
  pace: string | undefined,
  deltaSec: number,
): string {
  const deltaMin = deltaSec / 60;
  if (!pace) {
    return decimalToPaceStr(Math.max(1, DEFAULT_PACE_DECIMAL + deltaMin));
  }
  const cleaned = pace.trim().replace(/\s*\/km$/i, "");
  if (cleaned.includes("-")) {
    const [a, b] = cleaned
      .split("-")
      .map((p) => parsePaceToDecimal(p.trim()) ?? DEFAULT_PACE_DECIMAL);
    return `${decimalToPaceStr(Math.max(1, a + deltaMin))}-${decimalToPaceStr(Math.max(1, b + deltaMin))}`;
  }
  const decimal = parsePaceToDecimal(cleaned) ?? DEFAULT_PACE_DECIMAL;
  return decimalToPaceStr(Math.max(1, decimal + deltaMin));
}
