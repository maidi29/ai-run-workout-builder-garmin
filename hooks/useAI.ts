/**
 * AI Processing Hook
 * Manages AI workout extraction from text/images via backend API.
 * Requires Garmin auth - uses accessToken from useAuth.
 */

import { useState, useCallback } from "react";
import { WorkoutData, AIProcessingResult } from "../types";
import { apiClient } from "../api/client";
import { useAuth } from "./useAuth";

/** Must match backend MAX_TEXT_LENGTH */
export const MAX_TEXT_LENGTH = 5000;

interface AIState {
  processing: boolean;
  result?: AIProcessingResult;
  error?: string;
}

interface GenerateFromContextParams {
  feeling: string;
  goal: string;
  durationMinutes: number;
  thresholdPace?: string;
  easyPace?: string;
}

interface UseAIReturn {
  state: AIState;
  generateFromContext: (
    params: GenerateFromContextParams,
  ) => Promise<WorkoutData>;
  processTextMultiple: (description: string) => Promise<WorkoutData[]>;
  processImageMultiple: (
    imageBase64: string,
    mimeType?: string,
  ) => Promise<WorkoutData[]>;
  reset: () => void;
}

export function useAI(): UseAIReturn {
  const { state: authState } = useAuth();
  const [state, setState] = useState<AIState>({
    processing: false,
  });

  const generateFromContext = useCallback(
    async (params: GenerateFromContextParams) => {
      const accessToken = authState.accessToken;
      if (!accessToken) {
        throw new Error("You must be logged in to use AI features");
      }
      try {
        setState((prev) => ({
          ...prev,
          processing: true,
          error: undefined,
        }));

        const response = await apiClient.ai.generateFromContext(
          params,
          accessToken,
        );
        const data = (response as { data?: WorkoutData }).data;
        if (!data) throw new Error("No workout data");

        setState((prev) => ({
          ...prev,
          processing: false,
          result: {
            success: true,
            workoutData: data,
          },
        }));

        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate workout";
        setState((prev) => ({
          ...prev,
          processing: false,
          error: message,
          result: {
            success: false,
            error: message,
          },
        }));
        throw err;
      }
    },
    [authState.accessToken],
  );

  const processTextMultiple = useCallback(
    async (description: string) => {
      const accessToken = authState.accessToken;
      if (!accessToken) {
        throw new Error("You must be logged in to use AI features");
      }
      if (description.length > MAX_TEXT_LENGTH) {
        const message = `Text too long (${description.length} chars). Maximum is ${MAX_TEXT_LENGTH} characters.`;
        setState((prev) => ({
          ...prev,
          processing: false,
          error: message,
          result: { success: false, error: message },
        }));
        throw new Error(message);
      }
      try {
        setState((prev) => ({
          ...prev,
          processing: true,
          error: undefined,
        }));

        const response = await apiClient.ai.processTextMultiple(
          description,
          accessToken,
        );
        const workouts = (response as { workouts?: WorkoutData[] }).workouts;
        if (!workouts || workouts.length === 0) {
          throw new Error("No workouts detected in the text");
        }

        setState((prev) => ({
          ...prev,
          processing: false,
          result: {
            success: true,
            workoutData: workouts[0], // Store first for reference
          },
        }));

        return workouts;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to process multiple workouts";
        setState((prev) => ({
          ...prev,
          processing: false,
          error: message,
          result: {
            success: false,
            error: message,
          },
        }));
        throw err;
      }
    },
    [authState.accessToken],
  );

  const processImageMultiple = useCallback(
    async (imageBase64: string, mimeType?: string) => {
      const accessToken = authState.accessToken;
      if (!accessToken) {
        throw new Error("You must be logged in to use AI features");
      }
      try {
        setState((prev) => ({
          ...prev,
          processing: true,
          error: undefined,
        }));

        const response = await apiClient.ai.processImageMultiple(
          imageBase64,
          mimeType,
          accessToken,
        );
        const workouts = (response as { workouts?: WorkoutData[] }).workouts;
        if (!workouts || workouts.length === 0) {
          throw new Error("No workouts detected in the image");
        }

        setState((prev) => ({
          ...prev,
          processing: false,
          result: {
            success: true,
            workoutData: workouts[0],
          },
        }));

        return workouts;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to process image for workouts";
        setState((prev) => ({
          ...prev,
          processing: false,
          error: message,
          result: {
            success: false,
            error: message,
          },
        }));
        throw err;
      }
    },
    [authState.accessToken],
  );

  const reset = useCallback(() => {
    setState({
      processing: false,
      result: undefined,
      error: undefined,
    });
  }, []);

  return {
    state,
    generateFromContext,
    processTextMultiple,
    processImageMultiple,
    reset,
  };
}
