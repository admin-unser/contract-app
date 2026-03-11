import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = (formData.get("title") as string)?.trim() || "";
  const emailsRaw = (formData.get("emails") as string)?.trim() || "";
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "PDFファイルを選択してください。" },
      { status: 400 }
    );
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "PDFファイルのみアップロードできます。" },
      { status: 400 }
    );
  }

  const signerEmails = emailsRaw
    .split(/\r?\n/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const uniqueEmails = Array.from(new Set(signerEmails));

  const fileName = `${user.id}/${crypto.randomUUID()}.pdf`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(fileName, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "ストレージのアップロードに失敗しました。" },
      { status: 500 }
    );
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      file_path: uploadData.path,
      title: title || file.name,
      status: uniqueEmails.length > 0 ? "sent" : "draft",
    })
    .select("id")
    .single();

  if (docError || !doc) {
    await supabase.storage.from("documents").remove([uploadData.path]);
    return NextResponse.json(
      { error: docError?.message ?? "文書の保存に失敗しました。" },
      { status: 500 }
    );
  }

  if (uniqueEmails.length > 0) {
    const { error: signersError } = await supabase.from("envelope_signers").insert(
      uniqueEmails.map((email, i) => ({
        document_id: doc.id,
        email,
        order: i,
      }))
    );
    if (signersError) {
      await supabase.from("documents").delete().eq("id", doc.id);
      await supabase.storage.from("documents").remove([uploadData.path]);
      return NextResponse.json(
        { error: signersError.message ?? "署名者の保存に失敗しました。" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ id: doc.id });
}
