"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface AuditEntry {
  id: string;
  action: string;
  signer_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  document_created: "文書作成",
  document_sent: "署名依頼送信",
  otp_requested: "OTP送信",
  otp_verified: "本人確認完了",
  signature_started: "署名開始",
  signature_completed: "署名完了",
  document_completed: "全署名完了",
  document_downloaded: "文書ダウンロード",
  document_viewed: "文書閲覧",
};

export default function CertificatePage() {
  const { id: documentId } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/audit`)
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [documentId]);

  function downloadCsv() {
    const headers = ["日時", "アクション", "署名者ID", "IPアドレス", "ユーザーエージェント"];
    const rows = logs.map((l) => [
      new Date(l.created_at).toLocaleString("ja-JP"),
      ACTION_LABELS[l.action] || l.action,
      l.signer_id || "-",
      l.ip_address || "-",
      l.user_agent || "-",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${documentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <Link href={`/documents/${documentId}`} className="hover:text-blue-600 transition-colors">文書詳細</Link>
        <span>/</span>
        <span className="text-gray-800">署名証明・監査ログ</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">署名証明・監査ログ</h1>
        <button
          onClick={downloadCsv}
          disabled={logs.length === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSVダウンロード
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">操作履歴</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">読み込み中...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">監査ログがありません</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 space-x-3">
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                    {log.signer_id && <span>署名者: {log.signer_id.slice(0, 8)}...</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
