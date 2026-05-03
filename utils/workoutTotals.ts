/**
 * Workout totals calculation
 * Derives duration from distance+pace and distance from duration+pace when needed.
 * Only returns totals when EVERY section has calculable values.
 */

import { Exercise } from '../types';
import { parsePaceToDecimal, parsePaceRange } from './pace';

/** Single decimal min/km for calculation (uses average for ranges) */
function getPaceDecimal(paceStr: string | undefined): number | null {
  if (!paceStr || !paceStr.trim()) return null;
  const range = parsePaceRange(paceStr);
  if (range) return (range.slower + range.faster) / 2;
  return parsePaceToDecimal(paceStr);
}

/**
 * Computes duration (sec) and distance (km) for a single exercise.
 * Returns null for a value if it cannot be derived.
 */
function computeExerciseValues(ex: Exercise): {
  durationSec: number | null;
  distanceKm: number | null;
} {
  const duration = ex.duration;
  const distance = ex.distance;
  const pace = getPaceDecimal(ex.pace);

  let durationSec: number | null = duration != null ? duration : null;
  let distanceKm: number | null = distance != null && distance > 0 ? distance : null;

  // Derive duration from distance + pace: duration_sec = distance_km * pace_min_per_km * 60
  if (durationSec == null && distanceKm != null && pace != null) {
    durationSec = distanceKm * pace * 60;
  }

  // Derive distance from duration + pace: distance_km = duration_sec/60 / pace_min_per_km
  if (distanceKm == null && durationSec != null && pace != null && pace > 0) {
    distanceKm = durationSec / 60 / pace;
  }

  return { durationSec, distanceKm };
}

/**
 * Computes duration (sec) and distance (km) for rest in a repeat block.
 */
function computeRestValues(ex: Exercise): {
  durationSec: number | null;
  distanceKm: number | null;
} {
  const restSec = ex.restBetweenSets;
  const restDist = ex.restDistance;
  const restPace = getPaceDecimal(ex.restPace);

  let durationSec: number | null = restSec != null && restSec > 0 ? restSec : null;
  let distanceKm: number | null = restDist != null && restDist > 0 ? restDist : null;

  if (durationSec == null && distanceKm != null && restPace != null) {
    durationSec = distanceKm * restPace * 60;
  }
  if (distanceKm == null && durationSec != null && restPace != null && restPace > 0) {
    distanceKm = durationSec / 60 / restPace;
  }

  return { durationSec, distanceKm };
}

export interface WorkoutTotalsResult {
  totalDurationSec: number | null;
  totalDistanceKm: number | null;
  allDurationCalculable: boolean;
  allDistanceCalculable: boolean;
}

/**
 * Computes total duration and distance from all exercises.
 * Only returns non-null when EVERY section has calculable values.
 * For repeat blocks: uses skipLastRestStep (rest after last rep not counted).
 */
export function computeWorkoutTotals(exercises: Exercise[]): WorkoutTotalsResult {
  let totalDurationSec = 0;
  let totalDistanceKm = 0;
  let allDurationCalculable = true;
  let allDistanceCalculable = true;

  for (const ex of exercises) {
    const sets = ex.sets ?? 1;
    const main = computeExerciseValues(ex);

    if (sets > 1) {
      const rest = computeRestValues(ex);

      if (main.durationSec == null) allDurationCalculable = false;
      else if (rest.durationSec == null) allDurationCalculable = false;
      else {
        totalDurationSec += sets * main.durationSec + (sets - 1) * rest.durationSec;
      }

      if (main.distanceKm == null) allDistanceCalculable = false;
      else if (rest.distanceKm == null) allDistanceCalculable = false;
      else {
        totalDistanceKm += sets * main.distanceKm + (sets - 1) * rest.distanceKm;
      }
    } else {
      if (main.durationSec == null) allDurationCalculable = false;
      else totalDurationSec += main.durationSec;

      if (main.distanceKm == null) allDistanceCalculable = false;
      else totalDistanceKm += main.distanceKm;
    }
  }

  return {
    totalDurationSec: allDurationCalculable ? totalDurationSec : null,
    totalDistanceKm: allDistanceCalculable ? totalDistanceKm : null,
    allDurationCalculable,
    allDistanceCalculable,
  };
}
