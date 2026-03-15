/**
 * Security utilities for input sanitization and validation.
 */

/** Sanitize string input: trim, remove null bytes, limit length */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/\0/g, "")        // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // Remove control chars (keep \n, \r, \t)
    .slice(0, maxLength);
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/** Validate UUID format */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** Sanitize HTML to prevent XSS (strip all tags) */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Validate request origin matches expected domain */
export function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !appUrl) return true; // Allow if no origin (server-to-server)
  try {
    const originHost = new URL(origin).host;
    const appHost = new URL(appUrl).host;
    return originHost === appHost;
  } catch {
    return false;
  }
}

/** Log suspicious activity */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  request?: Request
) {
  const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request?.headers.get("user-agent") ?? "unknown";
  console.warn(`[SECURITY] ${event}`, { ...details, ip, ua, timestamp: new Date().toISOString() });
}
