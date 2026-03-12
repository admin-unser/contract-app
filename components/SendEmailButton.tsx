"use client";

import { useState } from "react";

export function SendEmailButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!confirm("未署名の署名者全員に署名依頼メールを送信しますか？")) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `送信に失敗しました (${res.status})`);
      }
      const data = await res.json();
      setResult({ sent: data.sent, total: data.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : "メール送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 text-sm disabled:opacity-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          {loading ? "送信中..." : "署名依頼メールを送信"}
        </button>
        {result && (
          <span className="text-sm text-green-600">
            {result.sent}/{result.total}件 送信完了
          </span>
        )}
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-2.5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
