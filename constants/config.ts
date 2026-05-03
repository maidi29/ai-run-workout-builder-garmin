/**
 * App configuration constants
 */

export const CONFIG = {
  // Garmin API configuration
  GARMIN: {
    REGISTRATION_URL:
      "https://apis.garmin.com/wellness-api/rest/user/registration",
  },

  // Secure storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: "garmin_access_token",
    REFRESH_TOKEN: "garmin_refresh_token",
    USER_ID: "garmin_user_id",
    AUTH_STATE: "auth_state",
    PERMISSIONS: "user_permissions",
  },

  // Timeouts (in milliseconds)
  TIMEOUTS: {
    API_REQUEST: 30000,
    TOKEN_REFRESH: 5 * 60 * 1000, // 5 minutes before expiry
  },

  // Supported file types
  FILE_TYPES: {
    IMAGES: ["image/jpeg", "image/png", "image/webp"],
    DOCUMENTS: ["text/plain", "application/pdf"],
  },

  // Workout type mapping
  WORKOUT_TYPES: {
    running: "RUNNING",
    cycling: "CYCLING",
    swimming: "SWIMMING",
    strength_training: "STRENGTH_TRAINING",
    yoga: "YOGA",
    hiit: "HIIT",
    walking: "WALKING",
    elliptical: "ELLIPTICAL",
    rowing: "ROWING",
    cross_training: "CROSS_TRAINING",
  },
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  MIN_WORKOUT_NAME_LENGTH: 3,
  MAX_WORKOUT_NAME_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
} as const;
