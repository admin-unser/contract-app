import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction } from "@/lib/types";

interface AuditLogParams {
  documentId: string;
  signerId?: string | null;
  action: AuditAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/** Record an audit log entry (uses admin client to bypass RLS) */
export async function recordAuditLog(params: AuditLogParams) {
  const { documentId, signerId, action, ipAddress, userAgent, metadata } = params;
  const admin = createAdminClient();

  const { error } = await admin.from("audit_logs").insert({
    document_id: documentId,
    signer_id: signerId ?? null,
    action,
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("Failed to record audit log:", error.message);
  }
}

/** Extract IP and User-Agent from request headers */
export function extractRequestInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ipAddress, userAgent };
}
