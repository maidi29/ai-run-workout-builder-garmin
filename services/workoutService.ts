/**
 * Handles workout creation and submission to Garmin
 */

import { VALIDATION } from "../constants/config";
import { WorkoutData } from "../types";
import { paceToRange, decimalToPaceStr } from "../utils/pace";

/**
 * Garmin API workout payload (matches connect.garmin.com / connectapi.garmin.com format)
 * @see example-garmin-export.json
 * @see GARMIN_JSON_SPEC.md
 */
export interface GarminWorkoutPayload {
  workoutName: string;
  description: string;
  sportType: {
    sportTypeId: number;
    sportTypeKey: string;
    displayOrder?: number;
  };
  workoutSegments: Array<{
    segmentOrder: number;
    sportType: {
      sportTypeId: number;
      sportTypeKey: string;
      displayOrder?: number;
    };
    workoutSteps: (ExecutableStepDTO | RepeatGroupDTO)[];
  }>;
  estimatedDurationInSecs?: number;
  estimatedDistanceInMeters?: number;
  estimatedDistanceUnit?: { unitKey: string };
}

type ExecutableStepDTO = {
  type: "ExecutableStepDTO";
  stepOrder: number;
  stepType: { stepTypeId: number; stepTypeKey: string; displayOrder?: number };
  endCondition: { conditionTypeId: number; conditionTypeKey: string };
  endConditionValue: number;
  preferredEndConditionUnit?: {
    unitId: number;
    unitKey: string;
    factor: number;
  };
  targetType: { workoutTargetTypeId: number; workoutTargetTypeKey: string };
  targetValueOne: number | null;
  targetValueTwo: number;
  childStepId?: number | null;
  description?: string | null;
};

type RepeatGroupDTO = {
  type: "RepeatGroupDTO";
  stepOrder: number;
  stepType: { stepTypeId: number; stepTypeKey: string; displayOrder?: number };
  numberOfIterations: number;
  skipLastRestStep: boolean;
  endCondition: { conditionTypeId: number; conditionTypeKey: string };
  workoutSteps: ExecutableStepDTO[];
  childStepId?: number;
};

const SPORT_TYPE_MAP: Record<
  string,
  { sportTypeId: number; sportTypeKey: string }
> = {
  running: { sportTypeId: 1, sportTypeKey: "running" },
  cycling: { sportTypeId: 2, sportTypeKey: "cycling" },
  swimming: { sportTypeId: 4, sportTypeKey: "swimming" },
  strength_training: { sportTypeId: 5, sportTypeKey: "strength_training" },
  yoga: { sportTypeId: 7, sportTypeKey: "yoga" },
  hiit: { sportTypeId: 8, sportTypeKey: "hiit" },
  walking: { sportTypeId: 9, sportTypeKey: "walking" },
  elliptical: { sportTypeId: 10, sportTypeKey: "elliptical" },
  rowing: { sportTypeId: 11, sportTypeKey: "rowing" },
  cross_training: { sportTypeId: 13, sportTypeKey: "cross_training" },
};

const STEP_TYPES = {
  warmup: { stepTypeId: 1, stepTypeKey: "warmup" },
  rest: { stepTypeId: 5, stepTypeKey: "rest" },
  interval: { stepTypeId: 3, stepTypeKey: "interval" },
  cooldown: { stepTypeId: 2, stepTypeKey: "cooldown" },
  repeat: { stepTypeId: 6, stepTypeKey: "repeat" },
};

const CONDITION_TIME = { conditionTypeId: 2, conditionTypeKey: "time" };
const CONDITION_DISTANCE = { conditionTypeId: 3, conditionTypeKey: "distance" };
const CONDITION_ITERATIONS = {
  conditionTypeId: 7,
  conditionTypeKey: "iterations",
};

const TARGET_NO_TARGET = {
  workoutTargetTypeId: 1,
  workoutTargetTypeKey: "no.target",
};
const TARGET_PACE_ZONE = {
  workoutTargetTypeId: 6,
  workoutTargetTypeKey: "pace.zone",
};

const KM_UNIT = { unitId: 2, unitKey: "kilometer", factor: 100000 };

type PaceRange = { slower: number; faster: number };

/**
 * Convert pace from decimal min/km to meters per second. Garmin stores pace targets in m/s, NOT decimal min/km.
 * e.g. 5:30/km = 5.5 decimal → 1000 / (5.5 * 60) = 3.030 m/s
 */
function paceDecimalToMps(decimalMinPerKm: number): number {
  return 1000 / (decimalMinPerKm * 60);
}

function createExecutableStep(
  stepOrder: number,
  stepTypeKey: keyof typeof STEP_TYPES,
  endConditionValue: number,
  isDistance: boolean,
  paceRange: PaceRange | null = null,
  description: string | null = null,
): ExecutableStepDTO {
  const stepType = STEP_TYPES[stepTypeKey];
  const endCondition = isDistance ? CONDITION_DISTANCE : CONDITION_TIME;
  const targetType = paceRange != null ? TARGET_PACE_ZONE : TARGET_NO_TARGET;
  // Garmin: targetValueOne = faster speed (higher m/s), targetValueTwo = slower speed (lower m/s)
  // paceRange.faster = lower min/km = faster pace → higher m/s → targetValueOne
  // paceRange.slower = higher min/km = slower pace → lower m/s → targetValueTwo
  const targetValueOne =
    paceRange != null ? paceDecimalToMps(paceRange.faster) : null;
  const targetValueTwo =
    paceRange != null ? paceDecimalToMps(paceRange.slower) : 0;

  const step: ExecutableStepDTO = {
    type: "ExecutableStepDTO",
    stepOrder,
    stepType: { ...stepType, displayOrder: stepType.stepTypeId },
    endCondition,
    endConditionValue: isDistance
      ? endConditionValue * 1000
      : endConditionValue, // km -> meters
    targetType,
    targetValueOne,
    targetValueTwo,
    childStepId: null,
    description,
  };

  if (isDistance) {
    step.preferredEndConditionUnit = KM_UNIT;
  }

  return step;
}

/**
 * Detect whether an exercise is a progression run (gradually increasing pace).
 * Garmin doesn't support native "progression" steps, so we pass the full pace range and describe the progression in the step description.
 */
function isProgressionExercise(name: string): boolean {
  return /progression/i.test(name);
}

/**
 * Build a Garmin step description for a progression exercise.
 * e.g. "Progression: gradual increase from 5:30 to 4:22 /km"
 */
function buildProgressionDescription(paceRange: PaceRange): string {
  const slowStr = decimalToPaceStr(paceRange.slower);
  const fastStr = decimalToPaceStr(paceRange.faster);
  return `Progression: gradual increase from ${slowStr} to ${fastStr} /km`;
}

class WorkoutService {
  /**
   * Converts extracted workout data to Garmin API format. Matches Garmin Connect website & sydspost/quick-plan format.
   */
  convertToGarminFormat(workoutData: WorkoutData): GarminWorkoutPayload {
    const sport = SPORT_TYPE_MAP[workoutData.type] || SPORT_TYPE_MAP.running;
    const sportType = { ...sport, displayOrder: 1 };

    const exercises = workoutData.exercises ?? [];
    const warmupExercise = exercises.find(
      ({ name, duration }) => /warm\s*up/i.test(name) && duration != null,
    );
    const cooldownExercise = exercises.find(
      ({ name, duration }) => /cool\s*down/i.test(name) && duration != null,
    );
    const warmupDuration = warmupExercise?.duration ?? 300; // default 5 min
    const cooldownDuration = cooldownExercise?.duration ?? 300; // default 5 min
    const mainExercises = exercises.filter(
      ({ name }) => !/warm\s*up/i.test(name) && !/cool\s*down/i.test(name),
    );

    const steps: (ExecutableStepDTO | RepeatGroupDTO)[] = [];

    // Warmup (always add)
    const warmupPace = warmupExercise?.pace
      ? paceToRange(warmupExercise.pace)
      : null;
    steps.push(
      createExecutableStep(1, "warmup", warmupDuration, false, warmupPace),
    );

    let stepOrder = 2;

    // Exercises as intervals or repeat groups (exclude warmup/cooldown)
    if (mainExercises.length > 0) {
      for (const exercise of mainExercises) {
        if (exercise.sets && exercise.sets > 1) {
          // Repeat group (matches sydspost / Garmin export format)
          const intervalDuration = exercise.duration ?? 60;
          const intervalDistance = exercise.distance;
          const isDistance = intervalDistance != null && intervalDistance > 0;
          const intervalPace =
            paceToRange(exercise.pace) ?? paceToRange("4:30");
          // Distance-based recovery (e.g. 400m easy jog) or time-based (e.g. 2 min rest)
          const hasRestDistance =
            exercise.restDistance != null && exercise.restDistance > 0;
          const restValue = hasRestDistance
            ? exercise.restDistance!
            : (exercise.restBetweenSets ?? 60);
          const restIsDistance = hasRestDistance;
          const restPace =
            paceToRange(exercise.restPace) ?? paceToRange("6:00");

          const innerSteps: ExecutableStepDTO[] = [
            createExecutableStep(
              stepOrder,
              "interval",
              isDistance ? intervalDistance! : intervalDuration,
              isDistance,
              intervalPace,
            ),
            createExecutableStep(
              stepOrder + 1,
              "rest",
              restValue,
              restIsDistance,
              restPace,
            ),
          ];
          innerSteps[0].childStepId = 1;
          innerSteps[1].childStepId = 1;

          const repeatStep: RepeatGroupDTO = {
            type: "RepeatGroupDTO",
            stepOrder,
            stepType: { ...STEP_TYPES.repeat, displayOrder: 6 },
            numberOfIterations: exercise.sets,
            skipLastRestStep: true,
            endCondition: CONDITION_ITERATIONS,
            workoutSteps: innerSteps,
            childStepId: 1,
          };
          steps.push(repeatStep);
          stepOrder += 2;
        } else {
          // Single interval (or progression)
          const duration = exercise.duration ?? 60;
          const distance = exercise.distance;
          const isDistance = distance != null && distance > 0;
          const paceRange = paceToRange(exercise.pace) ?? paceToRange("4:30");

          // Progression runs: pass full pace range + add description
          const stepDescription =
            isProgressionExercise(exercise.name) && paceRange
              ? buildProgressionDescription(paceRange)
              : null;

          steps.push(
            createExecutableStep(
              stepOrder,
              "interval",
              isDistance ? distance : duration,
              isDistance,
              paceRange,
              stepDescription,
            ),
          );
          stepOrder++;

          if (exercise.restBetweenSets) {
            steps.push(
              createExecutableStep(
                stepOrder,
                "rest",
                exercise.restBetweenSets,
                false,
                paceToRange("6:00"),
              ),
            );
            stepOrder++;
          }
        }
      }
    }

    // Cooldown
    const cooldownPace = cooldownExercise?.pace
      ? paceToRange(cooldownExercise.pace)
      : null;
    steps.push(
      createExecutableStep(
        stepOrder,
        "cooldown",
        cooldownDuration,
        false,
        cooldownPace,
      ),
    );

    const payload: GarminWorkoutPayload = {
      workoutName: workoutData.name,
      description: workoutData.description,
      sportType,
      workoutSegments: [
        {
          segmentOrder: 1,
          sportType,
          workoutSteps: steps,
        },
      ],
    };

    // Omit estimatedDurationInSecs/estimatedDistanceInMeters - Garmin requires estimateType and validates consistency. Garmin computes these from the workout steps.
    return payload;
  }

  validateWorkoutData(workoutData: WorkoutData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!workoutData.name || workoutData.name.trim().length === 0) {
      errors.push("Workout name is required");
    } else if (workoutData.name.length < VALIDATION.MIN_WORKOUT_NAME_LENGTH) {
      errors.push(
        `Workout name must be at least ${VALIDATION.MIN_WORKOUT_NAME_LENGTH} characters`,
      );
    } else if (workoutData.name.length > VALIDATION.MAX_WORKOUT_NAME_LENGTH) {
      errors.push(
        `Workout name must not exceed ${VALIDATION.MAX_WORKOUT_NAME_LENGTH} characters`,
      );
    }

    if (
      !workoutData.description ||
      workoutData.description.trim().length === 0
    ) {
      errors.push("Workout description is required");
    } else if (
      workoutData.description.length < VALIDATION.MIN_DESCRIPTION_LENGTH
    ) {
      errors.push(
        `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters`,
      );
    } else if (
      workoutData.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH
    ) {
      errors.push(
        `Description must not exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    if (workoutData.duration !== undefined && workoutData.duration <= 0) {
      errors.push("Duration must be greater than 0");
    }

    if (workoutData.distance !== undefined && workoutData.distance <= 0) {
      errors.push("Distance must be greater than 0");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  formatWorkoutForDisplay(workoutData: WorkoutData): string {
    const lines: string[] = [];

    lines.push(`Name: ${workoutData.name}`);
    lines.push(`Type: ${workoutData.type}`);

    if (workoutData.duration) {
      lines.push(`Duration: ${workoutData.duration} minutes`);
    }

    if (workoutData.distance) {
      lines.push(`Distance: ${workoutData.distance} km`);
    }

    lines.push(`\nDescription: ${workoutData.description}`);

    if (workoutData.exercises && workoutData.exercises.length > 0) {
      lines.push("\nExercises:");
      workoutData.exercises.forEach((exercise) => {
        let exerciseLine = `  - ${exercise.name}`;
        if (exercise.sets) exerciseLine += ` (${exercise.sets} sets)`;
        if (exercise.reps) exerciseLine += ` x ${exercise.reps} reps`;
        if (exercise.duration) exerciseLine += ` (${exercise.duration}s)`;
        if (exercise.distance) exerciseLine += ` (${exercise.distance}km)`;
        lines.push(exerciseLine);
      });
    }

    if (workoutData.notes) {
      lines.push(`\nNotes: ${workoutData.notes}`);
    }

    return lines.join("\n");
  }
}

export const workoutService = new WorkoutService();
