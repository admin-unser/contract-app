import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// フォルダ更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.color) updates.color = body.color;

  const { error } = await supabase
    .from("document_folders")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// フォルダ削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Remove folder reference from documents
  await supabase.from("documents").update({ folder_id: null }).eq("folder_id", id);

  const { error } = await supabase
    .from("document_folders")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
