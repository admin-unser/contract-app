import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Google Fonts CDN for Noto Sans JP (supports Japanese)
const NOTO_SANS_JP_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.woff2";

async function loadJapaneseFont(): Promise<ArrayBuffer> {
  const res = await fetch(NOTO_SANS_JP_URL);
  return res.arrayBuffer();
}

// Embed a PNG dataUrl image into a field area on a PDF page
async function embedImageInField(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument["getPages"]>[0],
  dataUrl: string,
  absX: number,
  absY: number,
  absWidth: number,
  absHeight: number
) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imgBytes = Buffer.from(base64, "base64");
  // Try PNG first, fall back to JPEG
  let img;
  try {
    img = await pdfDoc.embedPng(imgBytes);
  } catch {
    img = await pdfDoc.embedJpg(imgBytes);
  }
  const scale = Math.min(absWidth / img.width, absHeight / img.height, 1);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const offsetX = (absWidth - drawWidth) / 2;
  const offsetY = (absHeight - drawHeight) / 2;
  page.drawImage(img, {
    x: absX + offsetX,
    y: absY + offsetY,
    width: drawWidth,
    height: drawHeight,
  });
}

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
    .select("id, owner_id, file_path, status, title")
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

  // Get signature fields with field_type and field_value
  const { data: signatureFields } = await admin
    .from("signature_fields")
    .select("id, signer_id, field_type, field_value, page, x, y, width, height")
    .eq("document_id", documentId)
    .order("page", { ascending: true });

  const arrayBuffer = await fileData.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Register fontkit for custom font embedding
  pdfDoc.registerFontkit(fontkit);

  // Load Japanese font
  let jpFont;
  try {
    const fontBytes = await loadJapaneseFont();
    jpFont = await pdfDoc.embedFont(fontBytes, { subset: true });
  } catch {
    // Fallback: if font loading fails, we'll skip text rendering for JP
  }

  const pages = pdfDoc.getPages();

  // Build a map: signer_id -> fields[]
  type FieldRow = NonNullable<typeof signatureFields>[number];
  const fieldMap = new Map<string, FieldRow[]>();
  for (const field of signatureFields ?? []) {
    const existing = fieldMap.get(field.signer_id) ?? [];
    existing.push(field);
    fieldMap.set(field.signer_id, existing);
  }

  for (const signer of signers ?? []) {
    if (!signer.signature_data) continue;
    try {
      // signature_data is stored as: { signature: { type, text?, dataUrl? }, stampData: { type, dataUrl? } | null }
      const raw = JSON.parse(signer.signature_data);
      const sig = raw.signature ?? raw; // handle both nested and flat formats
      const stampData = raw.stampData ?? null;

      const signerFields = fieldMap.get(signer.id);

      if (signerFields && signerFields.length > 0) {
        for (const field of signerFields) {
          const pageIdx = field.page - 1;
          if (pageIdx < 0 || pageIdx >= pages.length) continue;
          const page = pages[pageIdx];
          const { width: pageWidth, height: pageHeight } = page.getSize();

          const absX = (field.x / 100) * pageWidth;
          const absWidth = (field.width / 100) * pageWidth;
          const absHeight = (field.height / 100) * pageHeight;
          const absY = pageHeight - ((field.y / 100) * pageHeight) - absHeight;

          const fieldType = field.field_type || "signature";

          if (fieldType === "signature") {
            // Render signature (drawing or typed)
            if ((sig.type === "drawing" || sig.type === "stamp") && sig.dataUrl) {
              await embedImageInField(pdfDoc, page, sig.dataUrl, absX, absY, absWidth, absHeight);
            } else if (sig.type === "typed" && sig.text) {
              if (jpFont) {
                const fontSize = Math.min(absHeight * 0.55, 14);
                page.drawText(sig.text, {
                  x: absX + 4,
                  y: absY + absHeight * 0.3,
                  size: fontSize,
                  font: jpFont,
                  color: rgb(0.07, 0.07, 0.07),
                });
              }
            }
          } else if (fieldType === "stamp") {
            // Render stamp image
            const stamp = stampData ?? sig;
            if (stamp?.dataUrl) {
              await embedImageInField(pdfDoc, page, stamp.dataUrl, absX, absY, absWidth, absHeight);
            }
          } else if (fieldType === "checkbox") {
            // Render checkmark if checked
            if (field.field_value === "true" || field.field_value === "1") {
              if (jpFont) {
                const fontSize = Math.min(absWidth, absHeight) * 0.7;
                page.drawText("✓", {
                  x: absX + absWidth * 0.15,
                  y: absY + absHeight * 0.2,
                  size: fontSize,
                  font: jpFont,
                  color: rgb(0.07, 0.07, 0.07),
                });
              }
            }
          } else {
            // Text fields: name, company, address, date, text
            const text = field.field_value;
            if (text && jpFont) {
              const fontSize = Math.min(absHeight * 0.55, 12);
              page.drawText(text, {
                x: absX + 3,
                y: absY + absHeight * 0.3,
                size: fontSize,
                font: jpFont,
                color: rgb(0.07, 0.07, 0.07),
              });
            }
          }
        }
      } else {
        // Fallback: no field positions defined, append signature to last page
        const lastPage = pages[pages.length - 1];
        const { height } = lastPage.getSize();
        const y = height - 80;

        if ((sig.type === "drawing" || sig.type === "stamp") && sig.dataUrl) {
          await embedImageInField(pdfDoc, lastPage, sig.dataUrl, 50, y - 60, 120, 60);
          if (jpFont) {
            lastPage.drawText(`署名: ${signer.name || signer.email}`, {
              x: 50,
              y: y - 68,
              size: 8,
              font: jpFont,
            });
          }
        } else if (sig.type === "typed" && sig.text && jpFont) {
          lastPage.drawText(`署名: ${signer.name || signer.email} — ${sig.text}`, {
            x: 50,
            y,
            size: 10,
            font: jpFont,
          });
        }

        // Also render stamp if present
        if (stampData?.dataUrl) {
          await embedImageInField(pdfDoc, lastPage, stampData.dataUrl, 200, y - 60, 60, 60);
        }
      }
    } catch {
      // skip parse errors
    }
  }

  const pdfBytes = await pdfDoc.save();
  const body = new Uint8Array(pdfBytes);
  const filename = doc.title ? encodeURIComponent(doc.title) + ".pdf" : `document-${documentId}.pdf`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
