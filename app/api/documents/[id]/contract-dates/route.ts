import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 契約日の更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contract_start_date, contract_end_date, reminder_days_before } = await request.json();

  const updates: Record<string, unknown> = {};
  if (contract_start_date !== undefined) updates.contract_start_date = contract_start_date || null;
  if (contract_end_date !== undefined) updates.contract_end_date = contract_end_date || null;
  if (reminder_days_before !== undefined) updates.reminder_days_before = reminder_days_before;

  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
