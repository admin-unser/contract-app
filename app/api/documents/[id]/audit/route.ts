import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .single();
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Use admin client to read audit logs (RLS allows only owner SELECT)
  const admin = createAdminClient();
  const { data: logs, error } = await admin
    .from("audit_logs")
    .select("id, action, signer_id, ip_address, user_agent, metadata, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(logs);
}
