import { createAdminClient } from "@/lib/supabase/admin";
import { sendOtpEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`otp:${ip}`, RATE_LIMITS.otp);
  const blocked = rateLimitResponse(rl);
  if (blocked) return blocked;

  const { token } = (await request.json()) as { token: string };
  if (!token) {
    return NextResponse.json({ error: "tokenが必要です。" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find signer by token
  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, email, name, document_id, signed_at")
    .eq("signing_token", token)
    .single();

  if (!signer) {
    return NextResponse.json({ error: "署名者が見つかりません。" }, { status: 404 });
  }
  if (signer.signed_at) {
    return NextResponse.json({ error: "すでに署名済みです。" }, { status: 400 });
  }

  // Get document title
  const { data: doc } = await supabase
    .from("documents")
    .select("title")
    .eq("id", signer.document_id)
    .single();

  // Generate 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Invalidate previous OTPs for this signer
  await supabase
    .from("otp_tokens")
    .delete()
    .eq("signer_id", signer.id);

  // Insert new OTP
  const { error: insertError } = await supabase
    .from("otp_tokens")
    .insert({
      signer_id: signer.id,
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    return NextResponse.json({ error: "OTPの生成に失敗しました。" }, { status: 500 });
  }

  // Send OTP email
  try {
    await sendOtpEmail({
      signerEmail: signer.email,
      signerName: signer.name,
      code,
      documentTitle: doc?.title ?? "文書",
    });
  } catch {
    return NextResponse.json({ error: "メール送信に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: signer.email });
}
