import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 文書をフォルダに移動
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { folder_id } = await request.json();

  const { error } = await supabase
    .from("documents")
    .update({ folder_id: folder_id || null })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
