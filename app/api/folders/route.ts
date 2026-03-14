import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// フォルダ一覧取得
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: folders } = await supabase
    .from("document_folders")
    .select("id, name, color, created_at")
    .eq("owner_id", user.id)
    .order("name");

  // Get document count per folder
  const { data: docs } = await supabase
    .from("documents")
    .select("folder_id")
    .eq("owner_id", user.id)
    .not("folder_id", "is", null);

  const counts: Record<string, number> = {};
  docs?.forEach((d) => {
    if (d.folder_id) counts[d.folder_id] = (counts[d.folder_id] || 0) + 1;
  });

  const result = (folders || []).map((f) => ({
    ...f,
    document_count: counts[f.id] || 0,
  }));

  return NextResponse.json(result);
}

// フォルダ作成
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "フォルダ名は必須です。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("document_folders")
    .insert({ owner_id: user.id, name: name.trim(), color: color || "#3b82f6" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
