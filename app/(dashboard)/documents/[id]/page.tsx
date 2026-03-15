import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DocumentWithSigners } from "@/lib/types";
import { CopySignLinkButton } from "@/components/CopySignLinkButton";
import { DownloadButton } from "@/components/DownloadButton";
import { SendEmailButton } from "@/components/SendEmailButton";
import { VerificationBadge } from "@/components/VerificationBadge";
import { AiRiskReview } from "@/components/AiRiskReview";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "下書き", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "署名待ち", color: "text-orange-600", bgColor: "bg-orange-50" },
  completed: { label: "完了", color: "text-green-600", bgColor: "bg-green-50" },
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

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select(`*, envelope_signers (*)`)
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (docError) {
    console.error("[DocumentDetail] Supabase error:", docError.message, docError.code);
  }

  if (!doc) notFound();

  const document = doc as unknown as DocumentWithSigners;
  const signers = document.envelope_signers ?? [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const config = statusConfig[document.status] ?? statusConfig.draft;
  const date = new Date(document.created_at);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const hasUnsigned = signers.some((s) => !s.signed_at);

  // Check if signature fields have been placed
  const { count: fieldCount } = await supabase
    .from("signature_fields")
    .select("id", { count: "exact", head: true })
    .eq("document_id", id);
  const hasFields = (fieldCount ?? 0) > 0;
  const isDraft = document.status === "draft";
  const needsSetup = isDraft && signers.length > 0;

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">
          ホーム
        </Link>
        <span>/</span>
        <span className="text-gray-800">{document.title}</span>
      </div>

      {/* Document header card */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-gray-400 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{document.title}</h1>
                <p className="text-sm text-gray-500 mt-1">作成日: {dateStr}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.color} ${config.bgColor}`}>
              {config.label}
            </span>
          </div>

          {/* Draft: show link to continue setup in wizard */}
          {isDraft && signers.length > 0 && (
            <div className="mt-4">
              <Link
                href="/documents/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                設定を続ける
              </Link>
            </div>
          )}

          {/* Sent: small re-send option only */}
          {document.status === "sent" && hasUnsigned && (
            <div className="mt-3">
              <SendEmailButton documentId={document.id} />
            </div>
          )}
        </div>

        {/* Signers section */}
        {signers.length > 0 && (
          <div className="border-t border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">署名者</h2>
            <p className="text-xs text-gray-400 mb-4">
              メール送信またはリンク共有で署名を依頼
            </p>
            <div className="space-y-2">
              {signers
                .sort((a, b) => a.order - b.order)
                .map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          {s.name && <span>{s.name} </span>}
                          {s.company_name && <span className="text-gray-400">({s.company_name}) </span>}
                          <span className={s.name ? "text-gray-400 text-xs" : ""}>{s.email}</span>
                        </div>
                        {s.signed_at ? (
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            署名済み
                          </div>
                        ) : (
                          <div className="text-xs text-orange-500 mt-0.5">未署名</div>
                        )}
                      </div>
                    </div>
                    {!s.signed_at && (
                      <CopySignLinkButton
                        url={`${baseUrl}/sign/token/${s.signing_token}`}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Download section */}
        {document.status === "completed" && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <DownloadButton documentId={document.id} />
            <div className="flex gap-2">
              <Link
                href={`/documents/${document.id}/certificate`}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M9 15l2 2 4-4" />
                </svg>
                監査ログ
              </Link>
            </div>
          </div>
        )}

        {/* Verification badge */}
        {document.status === "completed" && (document.document_hash || document.chain_hash) && (
          <div className="border-t border-gray-100 p-6">
            <VerificationBadge
              documentHash={document.document_hash}
              chainHash={document.chain_hash}
            />
          </div>
        )}
      </div>

      {/* AI Risk Review */}
      <div className="mt-6">
        <AiRiskReview documentId={document.id} />
      </div>
    </div>
  );
}
