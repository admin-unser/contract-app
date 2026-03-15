import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getOrCreateOrganization } from "@/lib/organization";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const org = await getOrCreateOrganization(user.id, user.email!);

    if (!org.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${APP_URL}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Billing] Portal error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
