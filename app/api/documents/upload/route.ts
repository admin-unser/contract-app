import { createClient } from "@/lib/supabase/server";
import { computeDocumentHash } from "@/lib/hash";
import { recordAuditLog, extractRequestInfo } from "@/lib/audit";
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
  const category = (formData.get("category") as string)?.trim() || null;
  const signersRaw = (formData.get("signers") as string)?.trim() || "";
  const emailMessage = (formData.get("email_message") as string)?.trim() || null;
  const file = formData.get("file") as File | null;
  const templateId = (formData.get("template_id") as string)?.trim() || null;

  // テンプレートまたはファイルのどちらかが必要
  if ((!file || file.size === 0) && !templateId) {
    return NextResponse.json(
      { error: "PDFファイルまたはテンプレートを選択してください。" },
      { status: 400 }
    );
  }
  if (file && file.size > 0 && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "PDFファイルのみアップロードできます。" },
      { status: 400 }
    );
  }

  let filePath: string;
  let documentHash: string | null = null;

  if (file && file.size > 0) {
    // Compute document hash before upload
    const fileBuffer = await file.arrayBuffer();
    documentHash = computeDocumentHash(fileBuffer);
    const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });

    // 直接アップロード
    const fileName = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, fileBlob, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "ストレージのアップロードに失敗しました。" },
        { status: 500 }
      );
    }
    filePath = uploadData.path;
  } else if (templateId) {
    // テンプレートからコピー
    const { data: template } = await supabase
      .from("templates")
      .select("file_path, name")
      .eq("id", templateId)
      .eq("owner_id", user.id)
      .single();

    if (!template) {
      return NextResponse.json({ error: "テンプレートが見つかりません。" }, { status: 404 });
    }

    // テンプレートファイルをdocumentsバケットにコピー
    const { data: fileData, error: dlError } = await supabase.storage
      .from("templates")
      .download(template.file_path);

    if (dlError || !fileData) {
      return NextResponse.json({ error: "テンプレートファイルの取得に失敗しました。" }, { status: 500 });
    }

    // Compute hash from template file
    const templateBuffer = await fileData.arrayBuffer();
    documentHash = computeDocumentHash(templateBuffer);

    const newFileName = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(newFileName, fileData, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    filePath = uploadData.path;
  } else {
    return NextResponse.json({ error: "ファイルが空です。" }, { status: 400 });
  }

  // Parse signers from JSON (new format) or fall back to empty
  let signerList: { company_name?: string; name?: string; email: string }[] = [];
  try {
    if (signersRaw) signerList = JSON.parse(signersRaw);
  } catch {
    // ignore parse errors
  }
  // De-duplicate by email
  const seen = new Set<string>();
  const uniqueSigners = signerList.filter((s) => {
    const email = s.email?.trim().toLowerCase();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      file_path: filePath,
      title: title || (file?.name ?? "無題"),
      status: "draft",
      category,
      template_id: templateId,
      email_message: emailMessage,
      document_hash: documentHash,
    })
    .select("id")
    .single();

  if (docError || !doc) {
    await supabase.storage.from("documents").remove([filePath]);
    return NextResponse.json(
      { error: docError?.message ?? "文書の保存に失敗しました。" },
      { status: 500 }
    );
  }

  if (uniqueSigners.length > 0) {
    const { error: signersError } = await supabase.from("envelope_signers").insert(
      uniqueSigners.map((s, i) => ({
        document_id: doc.id,
        email: s.email.trim().toLowerCase(),
        name: s.name?.trim() || null,
        company_name: s.company_name?.trim() || null,
        order: i,
      }))
    );
    if (signersError) {
      await supabase.from("documents").delete().eq("id", doc.id);
      await supabase.storage.from("documents").remove([filePath]);
      return NextResponse.json(
        { error: signersError.message ?? "署名者の保存に失敗しました。" },
        { status: 500 }
      );
    }
  }

  // Record audit log
  const { ipAddress, userAgent } = extractRequestInfo(request);
  await recordAuditLog({
    documentId: doc.id,
    action: "document_created",
    ipAddress,
    userAgent,
    metadata: {
      title: title || (file?.name ?? "無題"),
      signer_count: uniqueSigners.length,
      from_template: !!templateId,
    },
  });

  return NextResponse.json({ id: doc.id });
}
