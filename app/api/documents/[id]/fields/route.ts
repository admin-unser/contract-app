import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 署名フィールド一覧取得
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("signature_fields")
    .select("*")
    .eq("document_id", id)
    .order("page")
    .order("y");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 署名フィールド一括保存（全置き換え）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 文書所有者チェック
  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  if (!doc) return NextResponse.json({ error: "文書が見つかりません。" }, { status: 404 });

  const { fields } = await request.json() as {
    fields: { signer_id: string; page: number; x: number; y: number; width: number; height: number; field_type?: string; label?: string }[];
  };

  // 既存フィールドを削除
  await supabase.from("signature_fields").delete().eq("document_id", id);

  // 新規フィールドを挿入
  if (fields && fields.length > 0) {
    const { error } = await supabase.from("signature_fields").insert(
      fields.map((f) => ({
        document_id: id,
        signer_id: f.signer_id,
        page: f.page,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        field_type: f.field_type || "signature",
        label: f.label || null,
      }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
