import { createClient } from "@/lib/supabase/server";
import { getOrCreateOrganization, canSendDocument } from "@/lib/organization";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const org = await getOrCreateOrganization(user.id, user.email!);
    const result = await canSendDocument(org.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Billing] Usage check error:", err);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
