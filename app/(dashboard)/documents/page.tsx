import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Document } from "@/lib/types";

const statusLabel: Record<string, string> = {
  draft: "下書き",
  sent: "署名待ち",
  completed: "完了",
};

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">文書一覧</h1>
        <Link
          href="/documents/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規アップロード
        </Link>
      </div>
      {!documents?.length ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          文書がありません。新規アップロードから契約書を追加してください。
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {(documents as Document[]).map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
              >
                <span className="font-medium text-zinc-900">{doc.title}</span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                  {statusLabel[doc.status] ?? doc.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
