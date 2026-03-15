import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateOrganization, getSubscriptionWithPlan } from "@/lib/organization";
import { reviewContract } from "@/lib/ai-review";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId, text } = await request.json();

  // Check plan allows AI review
  try {
    const org = await getOrCreateOrganization(user.id, user.email!);
    const subPlan = await getSubscriptionWithPlan(org.id);

    if (subPlan && !org.is_internal) {
      const features = subPlan.plan.features;
      if (!features.ai_review) {
        return NextResponse.json({
          error: "AI契約レビューはStarterプラン以上でご利用いただけます。",
          code: "PLAN_UPGRADE_REQUIRED",
        }, { status: 403 });
      }
    }
  } catch (err) {
    console.error("[AI Review] Plan check failed:", err);
  }

  // If text provided directly, use it. Otherwise extract from document PDF
  let contractText = text;

  if (!contractText && documentId) {
    // For now, we expect the client to send extracted text
    return NextResponse.json({
      error: "契約書のテキストを送信してください",
    }, { status: 400 });
  }

  if (!contractText || contractText.trim().length < 50) {
    return NextResponse.json({
      error: "契約書のテキストが短すぎます。PDFからテキストが正しく抽出されているか確認してください。",
    }, { status: 400 });
  }

  try {
    const result = await reviewContract(contractText);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[AI Review] Error:", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "AI分析に失敗しました",
    }, { status: 500 });
  }
}
