import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id;
        const planId = session.metadata?.plan_id;
        const subscriptionId = session.subscription as string;

        if (orgId && planId && subscriptionId) {
          // Cancel existing active subscriptions
          await admin
            .from("subscriptions")
            .update({ status: "canceled", canceled_at: new Date().toISOString() })
            .eq("organization_id", orgId)
            .in("status", ["active", "trialing"]);

          // Create new subscription record
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId);

          await admin.from("subscriptions").insert({
            organization_id: orgId,
            plan_id: planId,
            status: "active",
            stripe_subscription_id: subscriptionId,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          });

          console.log(`[Stripe Webhook] Subscription created: org=${orgId} plan=${planId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;

        await admin
          .from("subscriptions")
          .update({
            status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status as string,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubId);

        console.log(`[Stripe Webhook] Subscription updated: ${stripeSubId} status=${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;

        // Mark as canceled
        await admin
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubId);

        // Get org_id and create free plan fallback
        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("organization_id")
          .eq("stripe_subscription_id", stripeSubId)
          .single();

        if (existingSub) {
          await admin.from("subscriptions").insert({
            organization_id: existingSub.organization_id,
            plan_id: "free",
            status: "active",
          });
        }

        console.log(`[Stripe Webhook] Subscription deleted: ${stripeSubId}, reverted to free plan`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId);
        }
        console.log(`[Stripe Webhook] Payment failed for subscription: ${subId}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
