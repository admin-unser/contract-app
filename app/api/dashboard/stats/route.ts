import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a team member of other owners
  const admin = createAdminClient();
  const { data: teamMemberships } = await admin
    .from("team_members")
    .select("owner_id")
    .eq("email", user.email ?? "")
    .eq("status", "active");

  const teamOwnerIds = (teamMemberships ?? []).map((m: any) => m.owner_id);
  const allOwnerIds = [user.id, ...teamOwnerIds];

  // Get all documents for this user and their team owners
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, status, category, created_at, contract_start_date, contract_end_date, reminder_days_before, folder_id")
    .in("owner_id", allOwnerIds);

  if (!docs) {
    return NextResponse.json({ monthly: [], statusBreakdown: [], categoryBreakdown: [] });
  }

  // Monthly stats for the last 6 months
  const now = new Date();
  const months: { key: string; label: string; sent: number; completed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getMonth() + 1}月`;
    months.push({ key, label, sent: 0, completed: 0 });
  }

  docs.forEach((doc) => {
    const created = new Date(doc.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const month = months.find((m) => m.key === key);
    if (month) {
      if (doc.status === "sent" || doc.status === "completed") month.sent++;
      if (doc.status === "completed") month.completed++;
    }
  });

  // Status breakdown
  const statusCounts: Record<string, number> = { draft: 0, sent: 0, completed: 0 };
  docs.forEach((doc) => {
    if (doc.status in statusCounts) statusCounts[doc.status]++;
  });
  const statusBreakdown = [
    { name: "下書き", value: statusCounts.draft, color: "#9ca3af" },
    { name: "署名待ち", value: statusCounts.sent, color: "#f97316" },
    { name: "完了", value: statusCounts.completed, color: "#22c55e" },
  ].filter((s) => s.value > 0);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  docs.forEach((doc) => {
    const cat = doc.category || "未分類";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Contract period alerts
  const contractAlerts: { id: string; title: string; contract_end_date: string; days_remaining: number; level: "danger" | "warning" | "info" }[] = [];
  docs.forEach((doc) => {
    if (!doc.contract_end_date || doc.status !== "completed") return;
    const endDate = new Date(doc.contract_end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const reminderDays = doc.reminder_days_before || 30;
    if (daysRemaining <= reminderDays) {
      contractAlerts.push({
        id: doc.id,
        title: doc.title,
        contract_end_date: doc.contract_end_date,
        days_remaining: daysRemaining,
        level: daysRemaining <= 0 ? "danger" : daysRemaining <= 7 ? "warning" : "info",
      });
    }
  });
  contractAlerts.sort((a, b) => a.days_remaining - b.days_remaining);

  // Contract timeline (upcoming expirations in next 12 months)
  const contractTimeline = docs
    .filter((d) => d.contract_end_date && d.status === "completed")
    .map((d) => ({
      id: d.id,
      title: d.title,
      contract_start_date: d.contract_start_date,
      contract_end_date: d.contract_end_date,
      days_remaining: Math.ceil((new Date(d.contract_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => a.days_remaining - b.days_remaining);

  return NextResponse.json({
    monthly: months.map(({ label, sent, completed }) => ({ label, sent, completed })),
    statusBreakdown,
    categoryBreakdown,
    contractAlerts,
    contractTimeline,
    totals: {
      total: docs.length,
      thisMonth: docs.filter((d) => {
        const created = new Date(d.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      ...statusCounts,
    },
  });
}
