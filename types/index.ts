/**
 * Core type definitions for the Garmin Workouts app
 */

/**
 * Garmin OAuth2 Token Response
 */
export interface GarminTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope?: string;
  jti?: string;
}

/**
 * User permissions from Garmin
 */
export type GarminPermissions = 
  | 'ACTIVITY_EXPORT'
  | 'WORKOUT_IMPORT'
  | 'HEALTH_EXPORT'
  | 'COURSE_IMPORT'
  | 'MCT_EXPORT';

/**
 * Extracted workout data from AI processing
 */
export interface WorkoutData {
  name: string;
  description: string;
  duration?: number; // in minutes
  distance?: number; // in km
  type: WorkoutType;
  exercises?: Exercise[];
  notes?: string;
}

/**
 * Individual exercise in a workout
 */
export interface Exercise {
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  duration?: number; // in seconds
  distance?: number; // in km
  restBetweenSets?: number; // in seconds
  /** Distance-based recovery between reps in km (e.g. 0.4 for 400m easy jog) */
  restDistance?: number;
  /** Pace for distance-based recovery (e.g. "5:45" or "5:45-6:15") */
  restPace?: string;
  /** Pace in min/km as string (e.g. "4:30" or "3:40") */
  pace?: string;
}

/**
 * Supported workout types in Garmin
 */
export type WorkoutType = 
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'yoga'
  | 'strength_training'
  | 'hiit'
  | 'walking'
  | 'elliptical'
  | 'rowing'
  | 'cross_training'
  | 'other';

/**
 * Garmin Workout Model for API submission
 */
export interface GarminWorkout {
  workoutName: string;
  description: string;
  workoutType: GarminWorkoutType;
  workoutSteps?: GarminWorkoutStep[];
}

/**
 * Garmin native workout types
 */
export type GarminWorkoutType = 
  | 'RUNNING'
  | 'CYCLING'
  | 'SWIMMING'
  | 'STRENGTH_TRAINING'
  | 'YOGA'
  | 'HIIT'
  | 'WALKING'
  | 'ELLIPTICAL'
  | 'ROWING'
  | 'CROSS_TRAINING';

/**
 * Step in a Garmin workout
 */
export interface GarminWorkoutStep {
  stepName: string;
  stepType: 'repeat' | 'interval' | 'rest' | 'warmup' | 'cooldown';
  duration?: {
    value: number;
    unit: 'distance' | 'time' | 'reps';
  };
  targetHeartRate?: {
    min: number;
    max: number;
  };
}

/**
 * App authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  displayName?: string;
  expiresAt?: number;
  permissions?: GarminPermissions[];
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  filename: string;
  size: number;
  type: 'image' | 'text';
}

/**
 * AI processing result
 */
export interface AIProcessingResult {
  success: boolean;
  workoutData?: WorkoutData;
  rawText?: string;
  error?: string;
}
