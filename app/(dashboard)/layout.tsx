import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get document counts by status
  const { data: documents } = await supabase
    .from("documents")
    .select("id, status")
    .eq("owner_id", user.id);

  const statusCounts = {
    draft: 0,
    sent: 0,
    completed: 0,
  };
  documents?.forEach((doc) => {
    if (doc.status in statusCounts) {
      statusCounts[doc.status as keyof typeof statusCounts]++;
    }
  });

  return (
    <DashboardShell email={user.email ?? ""} statusCounts={statusCounts}>
      {children}
    </DashboardShell>
  );
}
