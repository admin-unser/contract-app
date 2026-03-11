import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DocumentWithSigners } from "@/lib/types";
import { CopySignLinkButton } from "@/components/CopySignLinkButton";
import { DownloadButton } from "@/components/DownloadButton";

const statusLabel: Record<string, string> = {
  draft: "下書き",
  sent: "署名待ち",
  completed: "完了",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doc } = await supabase
    .from("documents")
    .select(
      `
      *,
      envelope_signers (*)
    `
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!doc) notFound();

  const document = doc as unknown as DocumentWithSigners;
  const signers = document.envelope_signers ?? [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href="/documents" className="text-sm text-blue-600 hover:underline">
          ← 文書一覧へ
        </Link>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{document.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              ステータス: {statusLabel[document.status] ?? document.status}
            </p>
          </div>
        </div>
        {signers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-700">署名者と署名リンク</h2>
            <p className="mt-1 text-xs text-zinc-500">
              各署名者に以下のリンクを共有してください（リンクをコピーしてメール等で送付）
            </p>
            <ul className="mt-3 space-y-2">
              {signers
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-700">
                      {s.email}
                      {s.signed_at ? (
                        <span className="ml-2 text-green-600">署名済み</span>
                      ) : (
                        <span className="ml-2 text-amber-600">未署名</span>
                      )}
                    </span>
                    {!s.signed_at && (
                      <CopySignLinkButton
                        url={`${baseUrl}/sign/${document.id}?signer=${encodeURIComponent(s.id)}`}
                      />
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
        {document.status === "completed" && (
          <div className="mt-6">
            <DownloadButton documentId={document.id} />
          </div>
        )}
      </div>
    </div>
  );
}
