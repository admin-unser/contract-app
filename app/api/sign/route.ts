import { createAdminClient } from "@/lib/supabase/admin";
import { sendCompletionNotification } from "@/lib/email";
import { computeChainHash } from "@/lib/hash";
import { recordAuditLog, extractRequestInfo } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { documentId, signerId, signature, stampData, token, fieldValues } = body as {
    documentId: string;
    signerId?: string;
    token?: string;
    signature: { type: string; text?: string; dataUrl?: string };
    stampData?: { type: string; text?: string; dataUrl?: string };
    fieldValues?: Record<string, string>; // field_id -> value
  };
  if (!documentId) {
    return NextResponse.json(
      { error: "documentId が必要です。" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { ipAddress, userAgent } = extractRequestInfo(request);

  // token or signerId でsigner特定
  let signer;
  if (token) {
    const { data } = await supabase
      .from("envelope_signers")
      .select("id, document_id, signed_at, otp_verified")
      .eq("signing_token", token)
      .eq("document_id", documentId)
      .single();
    signer = data;
  } else if (signerId) {
    const { data } = await supabase
      .from("envelope_signers")
      .select("id, document_id, signed_at, otp_verified")
      .eq("document_id", documentId)
      .eq("id", signerId)
      .single();
    signer = data;
  }

  if (!signer) {
    return NextResponse.json({ error: "署名者情報が見つかりません。" }, { status: 404 });
  }
  if (signer.signed_at) {
    return NextResponse.json({ error: "すでに署名済みです。" }, { status: 400 });
  }

  const signatureData = JSON.stringify({ signature, stampData: stampData || null });
  const signedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("envelope_signers")
    .update({ signed_at: signedAt, signature_data: signatureData })
    .eq("id", signer.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "署名の保存に失敗しました。" },
      { status: 500 }
    );
  }

  // Save per-field values
  if (fieldValues && Object.keys(fieldValues).length > 0) {
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      await supabase
        .from("signature_fields")
        .update({ field_value: value })
        .eq("id", fieldId)
        .eq("signer_id", signer.id);
    }
  }

  // Record audit log for signature
  await recordAuditLog({
    documentId,
    signerId: signer.id,
    action: "signature_completed",
    ipAddress,
    userAgent,
    metadata: { signature_type: signature.type },
  });

  // Update chain hash
  try {
    const { data: doc } = await supabase
      .from("documents")
      .select("document_hash, chain_hash")
      .eq("id", documentId)
      .single();

    if (doc) {
      const previousHash = doc.chain_hash || doc.document_hash || "";
      if (previousHash) {
        const newChainHash = computeChainHash(previousHash, signatureData, signedAt);
        await supabase
          .from("documents")
          .update({ chain_hash: newChainHash, updated_at: signedAt })
          .eq("id", documentId);
      }
    }
  } catch {
    // Chain hash update failure shouldn't block signature
  }

  // 全員署名完了チェック
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

    // Record completion audit log
    await recordAuditLog({
      documentId,
      action: "document_completed",
      ipAddress,
      userAgent,
      metadata: { signer_count: signers?.length ?? 0 },
    });

    // 完了通知メールをオーナーに送信
    try {
      const { data: doc } = await supabase
        .from("documents")
        .select("title, owner_id")
        .eq("id", documentId)
        .single();

      if (doc) {
        const { data: owner } = await supabase.auth.admin.getUserById(doc.owner_id);
        if (owner?.user?.email) {
          await sendCompletionNotification({
            ownerEmail: owner.user.email,
            documentTitle: doc.title,
            documentId,
            signerCount: signers?.length ?? 0,
          });
        }
      }
    } catch {
      // メール送信失敗しても署名は成功として扱う
    }
  }

  return NextResponse.json({ ok: true });
}
