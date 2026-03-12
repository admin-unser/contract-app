"use client";

import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "下書き", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "署名待ち", color: "text-orange-600", bgColor: "bg-orange-50" },
  completed: { label: "完了", color: "text-green-600", bgColor: "bg-green-50" },
};

interface DocumentItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  envelope_signers?: { id: string; email: string; signed_at: string | null }[];
}

export function DocumentList({
  documents,
  filterStatus,
}: {
  documents: DocumentItem[];
  filterStatus?: string;
}) {
  if (!documents.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <div className="text-gray-300 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          {filterStatus
            ? "該当する文書がありません。"
            : "文書がありません。新規アップロードから契約書を追加してください。"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          {filterStatus ? statusConfig[filterStatus]?.label ?? "文書" : "最近の文書"}
          <span className="ml-2 text-gray-400 font-normal">({documents.length}件)</span>
        </h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {documents.map((doc) => {
          const config = statusConfig[doc.status] ?? statusConfig.draft;
          const signerCount = doc.envelope_signers?.length ?? 0;
          const signedCount = doc.envelope_signers?.filter((s) => s.signed_at).length ?? 0;
          const date = new Date(doc.created_at);
          const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

          return (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-gray-400 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">{doc.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {dateStr}
                      {signerCount > 0 && (
                        <span className="ml-2">
                          署名: {signedCount}/{signerCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${config.color} ${config.bgColor}`}>
                  {config.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
