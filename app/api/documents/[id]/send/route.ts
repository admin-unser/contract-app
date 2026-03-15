import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSigningRequest } from "@/lib/email";
import { getOrCreateOrganization, canSendDocument } from "@/lib/organization";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

// 署名依頼メールを一括送信
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rl = rateLimit(`send:${ip}`, RATE_LIMITS.send);
  const blocked = rateLimitResponse(rl);
  if (blocked) return blocked;

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 使用量チェック
  let orgId: string | null = null;
  try {
    const org = await getOrCreateOrganization(user.id, user.email!);
    orgId = org.id;
    const usageCheck = await canSendDocument(org.id);
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: `今月の送信上限（${usageCheck.limit}件）に達しています。プランをアップグレードしてください。`,
        code: "USAGE_LIMIT_REACHED",
        current: usageCheck.current,
        limit: usageCheck.limit,
      }, { status: 403 });
    }
  } catch (err) {
    console.error("[Send API] Usage check failed:", err);
    // Usage check failure should not block sending
  }

  // 文書取得
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, email_message, owner_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "文書が見つかりません。" }, { status: 404 });

  // 署名者取得
  const { data: signers } = await supabase
    .from("envelope_signers")
    .select("id, email, name, company_name, signing_token, signed_at")
    .eq("document_id", id)
    .order("order");

  if (!signers || signers.length === 0) {
    return NextResponse.json({ error: "署名者が設定されていません。" }, { status: 400 });
  }

  const unsignedSigners = signers.filter((s) => !s.signed_at);
  if (unsignedSigners.length === 0) {
    return NextResponse.json({ error: "全員署名済みです。" }, { status: 400 });
  }

  // 送信者: 企業名 + 担当者名（苗字のみ）
  const companyName = user.user_metadata?.company_name || "";
  const fullName = user.user_metadata?.display_name || user.user_metadata?.full_name || "";
  const lastName = fullName.split(/[\s　]/)[0]; // 苗字のみ取得
  const senderName = [companyName, lastName].filter(Boolean).join(" ") || user.email || "送信者";
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const signer of unsignedSigners) {
    try {
      await sendSigningRequest({
        signerEmail: signer.email,
        signerName: signer.name,
        signerCompany: signer.company_name,
        documentTitle: doc.title,
        signingToken: signer.signing_token,
        senderName,
        customMessage: doc.email_message,
      });
      results.push({ email: signer.email, success: true });
    } catch (err) {
      results.push({
        email: signer.email,
        success: false,
        error: err instanceof Error ? err.message : "送信失敗",
      });
    }
  }

  // ステータスをsentに更新
  await supabase
    .from("documents")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id);

  // 使用量カウンターをインクリメント
  if (orgId) {
    try {
      const admin = createAdminClient();
      await admin.rpc("increment_usage", { org_id: orgId, field: "documents_sent" });
    } catch (err) {
      console.error("[Send API] Usage increment failed:", err);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedResults = results.filter((r) => !r.success);
  if (failedResults.length > 0) {
    console.error("[Send API] Failed emails:", JSON.stringify(failedResults));
  }
  return NextResponse.json({
    sent: successCount,
    total: unsignedSigners.length,
    results,
    ...(failedResults.length > 0 && { errors: failedResults.map(r => r.error) }),
  });
}
