import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all documents for this user
  const { data: docs } = await supabase
    .from("documents")
    .select("id, status, category, created_at")
    .eq("owner_id", user.id);

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

  return NextResponse.json({
    monthly: months.map(({ label, sent, completed }) => ({ label, sent, completed })),
    statusBreakdown,
    categoryBreakdown,
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
