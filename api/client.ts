/**
 * API Client
 * Type-safe HTTP client for backend communication + direct Garmin API calls.
 * Supports automatic 401 retry with token refresh.
 */

import { AIProcessingResult, WorkoutData } from "../types";
import { GarminWorkoutPayload } from "../services/workoutService";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const GARMIN_API = "https://connectapi.garmin.com";
const APP_API_KEY = process.env.EXPO_PUBLIC_APP_API_KEY;

/**
 * Callback the API client invokes when it receives a 401.
 * Should refresh the token and return the new access token or throw if refresh is not possible (triggers logout).
 */
type TokenRefreshCallback = () => Promise<string>;

interface RequestOptions {
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

class APIClient {
  private baseUrl: string;
  private onTokenRefresh: TokenRefreshCallback | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Register a callback that will be called when a 401 is received.
   * The callback should refresh the token and return the new access token.
   */
  setTokenRefreshCallback(cb: TokenRefreshCallback | null): void {
    this.onTokenRefresh = cb;
  }

  /**
   * Make an HTTP request with error handling and automatic 401 retry.
   */
  private async request<T>(
    url: string,
    options: RequestOptions & { body?: unknown } = {},
    _isRetry = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const requestInit: RequestInit = {
      method: options.method || "GET",
      headers,
    };

    if (options.body) {
      requestInit.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        // On 401, try refreshing the token once and retry
        if (
          response.status === 401 &&
          !_isRetry &&
          this.onTokenRefresh &&
          headers["Authorization"]
        ) {
          try {
            const newToken = await this.onTokenRefresh();
            const retryOptions = {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            return this.request<T>(url, retryOptions, true);
          } catch {
            // Refresh failed — throw the original 401
          }
        }

        const error = await response.text();
        throw new Error(
          `API Error (${response.status}): ${error || response.statusText}`,
        );
      }

      return response.json();
    } catch (error) {
      console.error(`Request failed: ${url}`, error);
      throw error;
    }
  }

  private async backendRequest<T>(
    endpoint: string,
    options: RequestOptions & { body?: unknown } = {},
  ): Promise<T> {
    return this.request<T>(`${this.baseUrl}${endpoint}`, options);
  }

  /**
   * Garmin API endpoints
   */
  garmin = {
    /**
     * Exchange a CAS ticket (captured from the SSO WebView redirect) for
     * OAuth2 tokens. The backend hits Garmin's OAuth endpoints (not behind
     * the Cloudflare bot rule that blocks the SSO login from datacenter IPs).
     */
    exchangeTicket: async (ticket: string) => {
      return this.backendRequest<{
        success: boolean;
        access_token: string;
        refresh_token: string;
        expires_in: number;
        userId: string;
        displayName: string;
      }>("/api/garmin/exchange-ticket", {
        method: "POST",
        body: { ticket },
      });
    },

    /**
     * Exchange a refresh_token for a new access_token. Routed through the
     * backend because the call requires OAuth1 consumer-secret signing.
     */
    refreshToken: async (refreshToken: string) => {
      return this.backendRequest<{
        success: boolean;
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>("/api/garmin/refresh-token", {
        method: "POST",
        body: { refresh_token: refreshToken },
      });
    },

    /**
     * Create a new workout in Garmin (direct call with Bearer token)
     */
    createWorkout: async (
      accessToken: string,
      workout: GarminWorkoutPayload,
    ) => {
      return this.request<{ workoutId: number; workoutName: string }>(
        `${GARMIN_API}/workout-service/workout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: workout,
        },
      );
    },

    /**
     * List user's workouts (direct call with Bearer token)
     */
    listWorkouts: async (accessToken: string, limit: number = 20) => {
      return this.request<
        Array<{
          workoutId: number;
          workoutName: string;
          sportType?: { sportTypeKey: string };
        }>
      >(`${GARMIN_API}/workout-service/workouts?limit=${limit}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },

    /**
     * Schedule a workout on Garmin Connect calendar
     * @param workoutId - ID returned from createWorkout
     * @param date - "YYYY-MM-DD" format
     */
    scheduleWorkout: async (
      accessToken: string,
      workoutId: number,
      date: string,
    ) => {
      return this.request<{ scheduledDate: string }>(
        `${GARMIN_API}/workout-service/schedule/${workoutId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { date },
        },
      );
    },
  };

  /**
   * AI Processing API endpoints (via backend)
   */
  ai = {
    processTextMultiple: async (description: string, accessToken: string) => {
      return this.backendRequest<{ workouts: WorkoutData[] }>(
        "/api/ai/process-text-multiple",
        {
          method: "POST",
          body: { description },
          headers: this.aiHeaders(accessToken),
        },
      );
    },

    processImageMultiple: async (
      imageBase64: string,
      mimeType: string | undefined,
      accessToken: string,
    ) => {
      return this.backendRequest<{ workouts: WorkoutData[] }>(
        "/api/ai/process-image-multiple",
        {
          method: "POST",
          body: { imageBase64, mimeType: mimeType || "image/jpeg" },
          headers: this.aiHeaders(accessToken),
        },
      );
    },

    generateFromContext: async (
      params: {
        feeling: string;
        goal: string;
        durationMinutes: number;
        thresholdPace?: string;
        easyPace?: string;
      },
      accessToken: string,
    ) => {
      return this.backendRequest<AIProcessingResult>(
        "/api/ai/generate-from-context",
        {
          method: "POST",
          body: params,
          headers: this.aiHeaders(accessToken),
        },
      );
    },
  };

  private aiHeaders(accessToken: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (APP_API_KEY) {
      headers["X-API-Key"] = APP_API_KEY;
    }
    return headers;
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new APIClient(BASE_URL);

export default apiClient;
