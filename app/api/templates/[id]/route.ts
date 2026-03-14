import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// テンプレートPDF URL取得
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: template } = await supabase
    .from("templates")
    .select("file_path")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: urlData, error } = await admin.storage
    .from("templates")
    .createSignedUrl(template.file_path, 3600);

  if (error || !urlData) return NextResponse.json({ error: "URL生成失敗" }, { status: 500 });
  return NextResponse.json({ url: urlData.signedUrl });
}

// テンプレート削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ファイルパス取得
  const { data: template } = await supabase
    .from("templates")
    .select("file_path")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!template) {
    return NextResponse.json({ error: "テンプレートが見つかりません。" }, { status: 404 });
  }

  // DB削除
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ストレージ削除
  await supabase.storage.from("templates").remove([template.file_path]);

  return NextResponse.json({ ok: true });
}

// テンプレート更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.folder_id !== undefined) updates.folder_id = body.folder_id || null;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("templates")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
