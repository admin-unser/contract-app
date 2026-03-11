import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { documentId, signerId, signature } = body as {
    documentId: string;
    signerId: string;
    signature: { type: string; text?: string; dataUrl?: string };
  };
  if (!documentId || !signerId || !signature) {
    return NextResponse.json(
      { error: "documentId, signerId, signature が必要です。" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, document_id, signed_at")
    .eq("document_id", documentId)
    .eq("id", signerId)
    .single();

  if (!signer) {
    return NextResponse.json({ error: "署名者情報が見つかりません。" }, { status: 404 });
  }
  if (signer.signed_at) {
    return NextResponse.json({ error: "すでに署名済みです。" }, { status: 400 });
  }

  const signatureData = JSON.stringify(signature);

  const { error: updateError } = await supabase
    .from("envelope_signers")
    .update({ signed_at: new Date().toISOString(), signature_data: signatureData })
    .eq("id", signerId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "署名の保存に失敗しました。" },
      { status: 500 }
    );
  }

  const { data: signers } = await supabase
    .from("envelope_signers")
    .select("signed_at")
    .eq("document_id", documentId);
  const allSigned = signers?.every((s) => s.signed_at);

  if (allSigned) {
    await supabase
      .from("documents")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", documentId);
  }

  return NextResponse.json({ ok: true });
}
