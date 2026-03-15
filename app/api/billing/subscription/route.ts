import { createClient } from "@/lib/supabase/server";
import { getOrCreateOrganization, getSubscriptionWithPlan, getCurrentUsage } from "@/lib/organization";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const org = await getOrCreateOrganization(user.id, user.email!);
    const subPlan = await getSubscriptionWithPlan(org.id);
    const usage = await getCurrentUsage(org.id);

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        is_internal: org.is_internal,
        has_billing: !!org.stripe_customer_id,
      },
      subscription: subPlan?.subscription ?? null,
      plan: subPlan?.plan ?? null,
      usage: {
        documents_sent: usage.documents_sent,
        documents_completed: usage.documents_completed,
        limit: subPlan?.plan.max_documents_per_month ?? null,
      },
    });
  } catch (err) {
    console.error("[Billing] Subscription fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
