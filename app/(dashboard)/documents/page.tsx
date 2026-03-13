import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Document } from "@/lib/types";
import { FileDropZone } from "@/components/FileDropZone";
import { DocumentList } from "@/components/DocumentList";
import { DashboardCharts } from "@/components/DashboardCharts";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("documents")
    .select("*, envelope_signers(id, email, signed_at, company_name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (filterStatus && ["draft", "sent", "completed"].includes(filterStatus)) {
    query = query.eq("status", filterStatus);
  }

  const { data: documents } = await query;

  const statusCounts = { draft: 0, sent: 0, completed: 0 };
  const { data: allDocs } = await supabase
    .from("documents")
    .select("status")
    .eq("owner_id", user.id);
  allDocs?.forEach((d) => {
    if (d.status in statusCounts) {
      statusCounts[d.status as keyof typeof statusCounts]++;
    }
  });

  const pageTitle = filterStatus
    ? { draft: "下書き", sent: "署名待ち", completed: "完了" }[filterStatus] ?? "ホーム"
    : "ホーム";

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        {pageTitle}
      </h1>

      {/* File drop zone - only show on home (no filter) */}
      {!filterStatus && <FileDropZone />}

      {/* Status summary cards - only on home */}
      {!filterStatus && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Link
            href="/documents?status=draft"
            className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl font-bold text-gray-800">{statusCounts.draft}</div>
            <div className="text-sm text-gray-500 mt-1">下書き</div>
          </Link>
          <Link
            href="/documents?status=sent"
            className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl font-bold text-orange-500">{statusCounts.sent}</div>
            <div className="text-sm text-gray-500 mt-1">署名待ち</div>
          </Link>
          <Link
            href="/documents?status=completed"
            className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-500 mt-1">完了</div>
          </Link>
        </div>
      )}

      {/* Dashboard charts - only on home */}
      {!filterStatus && <DashboardCharts />}

      {/* Document list */}
      <DocumentList documents={(documents as any[]) ?? []} filterStatus={filterStatus} />
    </div>
  );
}
