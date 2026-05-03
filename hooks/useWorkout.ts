/**
 * Workout Management Hook
 * Manages workout state, validation, and submission to backend
 */

import { useState, useCallback } from "react";
import { WorkoutData } from "../types";
import { workoutService } from "../services/workoutService";
import { apiClient } from "../api/client";

interface WorkoutState {
  current?: WorkoutData;
  loading: boolean;
  error?: string;
  submitted: WorkoutData[];
}

interface UseWorkoutReturn {
  state: WorkoutState;
  createWorkout: (workoutData: WorkoutData) => Promise<void>;
  validateWorkout: (workoutData: WorkoutData) => {
    valid: boolean;
    errors: string[];
  };
  submitToBackend: (
    accessToken: string,
    workout?: WorkoutData,
  ) => Promise<{ id: string; workoutName: string }>;
  submitAndSchedule: (
    accessToken: string,
    workout: WorkoutData,
    scheduleDate: string,
  ) => Promise<{ id: string; workoutName: string; scheduled: boolean }>;
  resetWorkout: () => void;
}

export function useWorkout(): UseWorkoutReturn {
  const [state, setState] = useState<WorkoutState>({
    loading: false,
    submitted: [],
  });

  const createWorkout = useCallback(async (workoutData: WorkoutData) => {
    try {
      console.log("[useWorkout] createWorkout called", {
        name: workoutData.name,
        type: workoutData.type,
      });
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      // Validate workout data
      const validation = workoutService.validateWorkoutData(workoutData);
      if (!validation.valid) {
        console.log("[useWorkout] Validation failed:", validation.errors);
        throw new Error(validation.errors.join(", "));
      }

      // Store current workout
      setState((prev) => ({
        ...prev,
        current: workoutData,
        loading: false,
      }));
      console.log("[useWorkout] Workout created and stored");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create workout";
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const validateWorkout = useCallback((workoutData: WorkoutData) => {
    return workoutService.validateWorkoutData(workoutData);
  }, []);

  const submitToBackend = useCallback(
    async (accessToken: string, workoutParam?: WorkoutData) => {
      try {
        console.log("[useWorkout] submitToBackend called", {
          hasWorkoutParam: !!workoutParam,
          hasStateCurrent: !!state.current,
          workoutParamName: workoutParam?.name,
        });
        setState((prev) => ({ ...prev, loading: true, error: undefined }));

        const workoutToSubmit = workoutParam ?? state.current;
        if (!workoutToSubmit || !workoutToSubmit.name) {
          console.log("[useWorkout] Submit failed: no workout to submit");
          throw new Error("No workout to submit");
        }

        // Validate when passing workout directly (e.g. from WorkoutPreviewScreen)
        if (workoutParam) {
          const validation = workoutService.validateWorkoutData(workoutParam);
          if (!validation.valid) {
            console.log("[useWorkout] Validation failed:", validation.errors);
            throw new Error(validation.errors.join(", "));
          }
        }

        console.log("[useWorkout] Submitting workout:", workoutToSubmit.name);

        // Convert to Garmin format (matches sydspost / quick-plan / Garmin Connect)
        const garminWorkout =
          workoutService.convertToGarminFormat(workoutToSubmit);

        // Call Garmin directly with Bearer token
        const response = await apiClient.garmin.createWorkout(
          accessToken,
          garminWorkout,
        );

        // Add to submitted history
        setState((prev) => ({
          ...prev,
          submitted: [...prev.submitted, workoutToSubmit],
          current: workoutParam ? prev.current : undefined,
          loading: false,
        }));

        const workoutName = response.workoutName || workoutToSubmit.name;
        console.log("[useWorkout] Submit success:", workoutName);
        return {
          id: response.workoutId?.toString() || "",
          workoutName,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit workout";
        console.log("[useWorkout] Submit failed:", message);
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    [state.current],
  );

  const submitAndSchedule = useCallback(
    async (accessToken: string, workout: WorkoutData, scheduleDate: string) => {
      // Step 1: Create workout
      const result = await submitToBackend(accessToken, workout);
      const workoutId = parseInt(result.id, 10);

      // Step 2: Schedule
      let scheduled = false;
      if (workoutId) {
        try {
          await apiClient.garmin.scheduleWorkout(
            accessToken,
            workoutId,
            scheduleDate,
          );
          scheduled = true;
          console.log("[useWorkout] Scheduled workout for", scheduleDate);
        } catch (err) {
          console.warn(
            "[useWorkout] Scheduling failed (workout was still created):",
            err,
          );
          // Workout exists, scheduling failed - caller handles the message
        }
      }

      return { ...result, scheduled };
    },
    [submitToBackend],
  );

  const resetWorkout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      current: undefined,
      error: undefined,
    }));
  }, []);

  return {
    state,
    createWorkout,
    validateWorkout,
    submitToBackend,
    submitAndSchedule,
    resetWorkout,
  };
}
