/**
 * Shared environment helpers for security-related checks.
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Exit if production is missing required secrets. Call once at startup.
 */
export function assertProductionSecrets(): void {
  if (!isProduction()) return;

  if (!process.env.APP_API_KEY?.trim()) {
    console.error(
      "[FATAL] APP_API_KEY is required when NODE_ENV=production. Set it in your deployment secrets.",
    );
    process.exit(1);
  }
}
