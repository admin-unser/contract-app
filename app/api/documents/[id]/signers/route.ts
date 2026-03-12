import { createClient } from "@/lib/supabase/server";
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

  const { data: signers, error } = await supabase
    .from("envelope_signers")
    .select("id, email, name, company_name, order")
    .eq("document_id", documentId)
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(signers);
}
