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

  // Get signers with their signature data
  const { data: signers } = await admin
    .from("envelope_signers")
    .select("id, signature_data, email, name")
    .eq("document_id", documentId)
    .not("signature_data", "is", null)
    .order("order", { ascending: true });

  // Get signature fields (positioned fields)
  const { data: signatureFields } = await admin
    .from("signature_fields")
    .select("signer_id, page, x, y, width, height")
    .eq("document_id", documentId)
    .order("page", { ascending: true });

  const arrayBuffer = await fileData.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  // Build a map: signer_id -> fields[]
  const fieldMap = new Map<string, typeof signatureFields>();
  for (const field of signatureFields ?? []) {
    const existing = fieldMap.get(field.signer_id) ?? [];
    existing.push(field);
    fieldMap.set(field.signer_id, existing);
  }

  for (const signer of signers ?? []) {
    if (!signer.signature_data) continue;
    try {
      const sig = JSON.parse(signer.signature_data) as {
        type: string;
        text?: string;
        dataUrl?: string;
      };

      const signerFields = fieldMap.get(signer.id);

      if (signerFields && signerFields.length > 0) {
        // Place signature at designated field positions
        for (const field of signerFields) {
          const pageIdx = field.page - 1; // 1-indexed -> 0-indexed
          if (pageIdx < 0 || pageIdx >= pages.length) continue;
          const page = pages[pageIdx];
          const { width: pageWidth, height: pageHeight } = page.getSize();

          // Convert percentage to absolute coordinates
          // PDF coordinate system: origin at bottom-left
          const absX = (field.x / 100) * pageWidth;
          const absWidth = (field.width / 100) * pageWidth;
          const absHeight = (field.height / 100) * pageHeight;
          // y% is from top in our system, PDF y is from bottom
          const absY = pageHeight - ((field.y / 100) * pageHeight) - absHeight;

          if (sig.type === "drawing" && sig.dataUrl) {
            const base64 = sig.dataUrl.replace(/^data:image\/\w+;base64,/, "");
            const img = await pdfDoc.embedPng(Buffer.from(base64, "base64"));
            const scale = Math.min(absWidth / img.width, absHeight / img.height, 1);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            // Center within field
            const offsetX = (absWidth - drawWidth) / 2;
            const offsetY = (absHeight - drawHeight) / 2;
            page.drawImage(img, {
              x: absX + offsetX,
              y: absY + offsetY,
              width: drawWidth,
              height: drawHeight,
            });
          } else if (sig.type === "typed" && sig.text) {
            const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
            const fontSize = Math.min(absHeight * 0.6, 14);
            page.drawText(sig.text, {
              x: absX + 4,
              y: absY + absHeight * 0.3,
              size: fontSize,
              font,
            });
          }
        }
      } else {
        // Fallback: no field positions defined, append to last page
        const lastPage = pages[pages.length - 1];
        const { height } = lastPage.getSize();
        let y = height - 80;

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
          lastPage.drawText(`署名: ${signer.name || signer.email}`, {
            x: 50,
            y: y - 68,
            size: 8,
          });
        } else if (sig.type === "typed" && sig.text) {
          const font = pdfDoc.embedStandardFont(StandardFonts.Helvetica);
          lastPage.drawText(`署名: ${signer.name || signer.email} - ${sig.text}`, {
            x: 50,
            y,
            size: 10,
            font,
          });
        }
      }
    } catch {
      // skip parse errors
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
