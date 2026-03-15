import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization, Plan, Subscription, UsageRecord } from "@/lib/types";

/**
 * Get or create the organization for the current user.
 * Every user belongs to exactly one org (auto-created on first access).
 */
export async function getOrCreateOrganization(userId: string, userEmail: string): Promise<Organization> {
  const admin = createAdminClient();

  // Check if user is already a member of an org
  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (membership) {
    const { data: org } = await admin
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();
    if (org) return org as Organization;
  }

  // Check if user owns an org
  const { data: ownedOrg } = await admin
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .limit(1)
    .single();

  if (ownedOrg) return ownedOrg as Organization;

  // Auto-create organization
  const isInternal = userEmail.endsWith("@unser-inc.com");
  const orgName = isInternal ? "UNSER" : userEmail.split("@")[0];

  const { data: newOrg, error } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      owner_id: userId,
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create organization: ${error.message}`);

  // Add user as owner member
  await admin.from("organization_members").insert({
    organization_id: newOrg.id,
    user_id: userId,
    role: "owner",
  });

  // Create free subscription
  await admin.from("subscriptions").insert({
    organization_id: newOrg.id,
    plan_id: isInternal ? "business" : "free",
    status: "active",
  });

  return newOrg as Organization;
}

/**
 * Get current subscription with plan details
 */
export async function getSubscriptionWithPlan(organizationId: string): Promise<{
  subscription: Subscription;
  plan: Plan;
} | null> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!sub) return null;

  const { data: plan } = await admin
    .from("plans")
    .select("*")
    .eq("id", sub.plan_id)
    .single();

  if (!plan) return null;

  return {
    subscription: sub as Subscription,
    plan: { ...plan, features: plan.features as Plan["features"] } as Plan,
  };
}

/**
 * Get current month usage
 */
export async function getCurrentUsage(organizationId: string): Promise<UsageRecord> {
  const admin = createAdminClient();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const { data } = await admin
    .from("usage_records")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("period_start", periodStart)
    .single();

  if (data) return data as UsageRecord;

  // Return empty usage
  return {
    id: "",
    organization_id: organizationId,
    period_start: periodStart,
    period_end: periodStart,
    documents_sent: 0,
    documents_completed: 0,
  };
}

/**
 * Check if org can send more documents this month
 */
export async function canSendDocument(organizationId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number | null;
  isInternal: boolean;
}> {
  const subPlan = await getSubscriptionWithPlan(organizationId);
  if (!subPlan) {
    return { allowed: false, current: 0, limit: 0, isInternal: false };
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("is_internal")
    .eq("id", organizationId)
    .single();

  const isInternal = org?.is_internal ?? false;

  // Internal orgs have no limits
  if (isInternal) {
    return { allowed: true, current: 0, limit: null, isInternal: true };
  }

  const maxDocs = subPlan.plan.max_documents_per_month;
  if (maxDocs === null) {
    return { allowed: true, current: 0, limit: null, isInternal: false };
  }

  const usage = await getCurrentUsage(organizationId);
  return {
    allowed: usage.documents_sent < maxDocs,
    current: usage.documents_sent,
    limit: maxDocs,
    isInternal: false,
  };
}
