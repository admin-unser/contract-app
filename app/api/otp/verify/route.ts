import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog, extractRequestInfo } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token, code } = (await request.json()) as { token: string; code: string };
  if (!token || !code) {
    return NextResponse.json({ error: "tokenとcodeが必要です。" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find signer
  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, document_id")
    .eq("signing_token", token)
    .single();

  if (!signer) {
    return NextResponse.json({ error: "署名者が見つかりません。" }, { status: 404 });
  }

  // Find valid OTP
  const { data: otp } = await supabase
    .from("otp_tokens")
    .select("id, code, expires_at, verified")
    .eq("signer_id", signer.id)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otp) {
    return NextResponse.json({ error: "認証コードが見つかりません。再送信してください。" }, { status: 400 });
  }

  if (new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "認証コードの有効期限が切れています。再送信してください。" }, { status: 400 });
  }

  if (otp.code !== code.trim()) {
    return NextResponse.json({ error: "認証コードが正しくありません。" }, { status: 400 });
  }

  // Mark OTP as verified
  await supabase
    .from("otp_tokens")
    .update({ verified: true })
    .eq("id", otp.id);

  // Mark signer as OTP verified
  await supabase
    .from("envelope_signers")
    .update({ otp_verified: true })
    .eq("id", signer.id);

  // Record audit log
  const { ipAddress, userAgent } = extractRequestInfo(request);
  await recordAuditLog({
    documentId: signer.document_id,
    signerId: signer.id,
    action: "otp_verified",
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
