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

  const { data: doc } = await supabase
    .from("documents")
    .select("id, owner_id, file_path")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: urlData, error } = await admin.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600);

  if (error || !urlData) {
    return NextResponse.json({ error: "URL生成に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ url: urlData.signedUrl });
}
