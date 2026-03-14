import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get doc to find file_path for cleanup
  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_path, owner_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete related records first (cascade should handle most, but be explicit)
  await supabase.from("signature_fields").delete().eq("document_id", id);
  await supabase.from("envelope_signers").delete().eq("document_id", id);
  await supabase.from("audit_logs").delete().eq("document_id", id);

  // Delete the document
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cleanup storage
  if (doc.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  return NextResponse.json({ ok: true });
}
