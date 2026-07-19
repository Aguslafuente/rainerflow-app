import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "tf_admin";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}
function safeEqual(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

function adminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret =
    process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !password || !secret) return null;
  return { email, password, secret };
}

export function isAdminConfigured() {
  return adminConfig() !== null;
}

export function validateAdminCredentials(email: string, password: string) {
  const config = adminConfig();
  if (!config) return false;

  return (
    safeEqual(email.trim().toLowerCase(), config.email) &&
    safeEqual(password, config.password)
  );
}

export function createAdminSessionToken() {
  const config = adminConfig();
  if (!config) throw new Error("Admin authentication is not configured");

  return createHmac("sha256", config.secret)
    .update(`trainerflow-admin:${config.email}`)
    .digest("hex");
}

export function validateAdminSession(token: string | null | undefined) {
  if (!token || !isAdminConfigured()) return false;
  return safeEqual(token, createAdminSessionToken());
}
