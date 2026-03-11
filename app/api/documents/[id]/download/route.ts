import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

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
    .select("id, owner_id, file_path, status")
    .eq("id", documentId)
    .single();

  if (!doc || doc.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.status !== "completed") {
    return NextResponse.json(
      { error: "文書は署名完了後にダウンロードできます。" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: fileData, error: fileError } = await admin.storage
    .from("documents")
    .download(doc.file_path);

  if (fileError || !fileData) {
    return NextResponse.json(
      { error: "ファイルの取得に失敗しました。" },
      { status: 500 }
    );
  }

  const { data: signers } = await admin
    .from("envelope_signers")
    .select("signature_data, email")
    .eq("document_id", documentId)
    .not("signature_data", "is", null)
    .order("order", { ascending: true });

  const arrayBuffer = await fileData.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { height } = lastPage.getSize();
  let y = height - 80;

  for (const signer of signers ?? []) {
    if (!signer.signature_data) continue;
    try {
      const sig = JSON.parse(signer.signature_data) as {
        type: string;
        text?: string;
        dataUrl?: string;
      };
      if (sig.type === "drawing" && sig.dataUrl) {
        const base64 = sig.dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const img = await pdfDoc.embedPng(Buffer.from(base64, "base64"));
        const scale = Math.min(120 / img.width, 60 / img.height, 1);
        lastPage.drawImage(img, {
          x: 50,
          y: y - 60 * scale,
          width: img.width * scale,
          height: img.height * scale,
        });
        lastPage.drawText(`署名: ${signer.email}`, {
          x: 50,
          y: y - 68,
          size: 8,
        });
        y -= 80;
      } else if (sig.type === "typed" && sig.text) {
        const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
        lastPage.drawText(`署名: ${signer.email} - ${sig.text}`, {
          x: 50,
          y,
          size: 10,
          font,
        });
        y -= 24;
      }
    } catch {
      // 署名データのパースに失敗した場合はスキップ
    }
  }

  const pdfBytes = await pdfDoc.save();
  const body = new Uint8Array(pdfBytes);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="document-${documentId}.pdf"`,
    },
  });
}
