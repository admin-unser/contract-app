import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// テンプレート一覧取得
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("templates")
    .select("*, template_folders(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// テンプレートアップロード
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const folderId = (formData.get("folder_id") as string)?.trim() || null;
  const file = formData.get("file") as File | null;

  if (!name) {
    return NextResponse.json({ error: "テンプレート名を入力してください。" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "PDFファイルを選択してください。" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDFファイルのみアップロードできます。" }, { status: 400 });
  }

  const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("templates")
    .upload(filePath, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: template, error: insertError } = await supabase
    .from("templates")
    .insert({
      owner_id: user.id,
      folder_id: folderId,
      name,
      description,
      file_path: filePath,
    })
    .select("id")
    .single();

  if (insertError) {
    await supabase.storage.from("templates").remove([filePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: template.id });
}
