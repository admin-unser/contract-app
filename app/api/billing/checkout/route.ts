import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getOrCreateOrganization } from "@/lib/organization";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await request.json();
  if (!planId || !["starter", "business"].includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const org = await getOrCreateOrganization(user.id, user.email!);

    // Internal orgs don't need to pay
    if (org.is_internal) {
      return NextResponse.json({ error: "Internal organizations cannot be billed" }, { status: 400 });
    }

    const admin = createAdminClient();
    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { organization_id: org.id, user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("organizations").update({ stripe_customer_id: customerId }).eq("id", org.id);
    }

    // Get Stripe price ID from plans table
    const { data: plan } = await admin.from("plans").select("stripe_price_id").eq("id", planId).single();
    if (!plan?.stripe_price_id) {
      return NextResponse.json({ error: "Plan has no Stripe price configured" }, { status: 400 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${APP_URL}/settings/billing?success=true`,
      cancel_url: `${APP_URL}/settings/billing?canceled=true`,
      metadata: { organization_id: org.id, plan_id: planId },
      subscription_data: {
        metadata: { organization_id: org.id, plan_id: planId },
      },
      allow_promotion_codes: true,
      locale: "ja",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Billing] Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
