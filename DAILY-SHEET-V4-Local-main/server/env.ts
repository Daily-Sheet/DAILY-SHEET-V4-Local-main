/**
 * Environment variable validation.
 * Import this module early in server startup to catch misconfiguration fast.
 *
 * Policy:
 *   production  → hard fail (throws) on missing required vars
 *   development → warn on missing optional vars; fail on required
 */

const isProd = process.env.NODE_ENV === "production";

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `[env] Required environment variable "${key}" is not set. ` +
      `Check your .env.local or deployment secrets.`
    );
  }
  return val;
}

function optional(key: string, fallback?: string): string | undefined {
  const val = process.env[key];
  if (!val && !fallback && isProd) {
    // In dev, stay silent on optional missing vars
  } else if (!val && !fallback) {
    // nothing to warn about
  }
  return val ?? fallback;
}

function warnIfMissing(key: string, description: string) {
  if (!process.env[key]) {
    console.warn(`[env] Optional var "${key}" is not set — ${description}`);
  }
}

// ── Required ─────────────────────────────────────────────────────────────────

export const DATABASE_URL = required("DATABASE_URL");
export const SESSION_SECRET = required("SESSION_SECRET");

// ── Optional with fallbacks ───────────────────────────────────────────────────

export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const PORT = parseInt(process.env.PORT ?? "5000", 10);

// CORS_ORIGIN: empty string means same-origin (no CORS header needed)
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "";

export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Daily Sheet <noreply@daily-sheet.app>";

export const DEFAULT_OBJECT_STORAGE_BUCKET_ID =
  process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

export const AI_INTEGRATIONS_OPENAI_API_KEY =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
export const AI_INTEGRATIONS_OPENAI_BASE_URL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

// ── Dev-mode warnings for optional integrations ───────────────────────────────

if (NODE_ENV !== "production") {
  warnIfMissing("RESEND_API_KEY", "invite emails will be logged to console instead of sent");
  warnIfMissing(
    "DEFAULT_OBJECT_STORAGE_BUCKET_ID",
    "file uploads will use ./uploads/ on disk (fine for local dev)"
  );
}
