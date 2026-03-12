import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// フォルダ一覧
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("template_folders")
    .select("*")
    .eq("owner_id", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// フォルダ作成
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "フォルダ名を入力してください。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("template_folders")
    .insert({ owner_id: user.id, name: name.trim() })
    .select("id, name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// フォルダ削除
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "IDが必要です。" }, { status: 400 });

  const { error } = await supabase
    .from("template_folders")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
