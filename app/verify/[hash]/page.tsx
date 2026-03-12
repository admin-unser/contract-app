"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface VerificationResult {
  verified: boolean;
  message?: string;
  document?: {
    title: string;
    status: string;
    created_at: string;
    document_hash: string | null;
    chain_hash: string | null;
  };
  signers?: {
    name: string | null;
    company_name: string | null;
    email: string;
    signed_at: string | null;
  }[];
}

export default function VerifyPage() {
  const { hash } = useParams<{ hash: string }>();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${hash}`)
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ verified: false, message: "検証に失敗しました。" }))
      .finally(() => setLoading(false));
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">検証中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-lg font-bold text-gray-800">UNSER Sign</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">文書検証</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {result?.verified ? (
            <>
              {/* Verified badge */}
              <div className="bg-green-50 border-b border-green-100 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-800">文書の真正性が確認されました</div>
                  <div className="text-xs text-green-600">改ざんは検出されませんでした</div>
                </div>
              </div>

              {/* Document info */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs text-gray-500">文書名</div>
                  <div className="text-sm font-medium text-gray-800 mt-0.5">{result.document?.title}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ステータス</div>
                  <div className="text-sm font-medium text-gray-800 mt-0.5">
                    {result.document?.status === "completed" ? "署名完了" : "署名中"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">作成日</div>
                  <div className="text-sm text-gray-700 mt-0.5">
                    {result.document?.created_at ? new Date(result.document.created_at).toLocaleDateString("ja-JP") : "-"}
                  </div>
                </div>

                {/* Signers */}
                {result.signers && result.signers.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">署名者</div>
                    <div className="space-y-2">
                      {result.signers.map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <div>
                            <div className="text-sm text-gray-700">
                              {s.name || s.email}
                              {s.company_name && <span className="text-gray-400 text-xs ml-1">({s.company_name})</span>}
                            </div>
                          </div>
                          {s.signed_at ? (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {new Date(s.signed_at).toLocaleDateString("ja-JP")}
                            </div>
                          ) : (
                            <span className="text-xs text-orange-500">未署名</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hashes */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500 mb-2">ハッシュ情報</div>
                  {result.document?.document_hash && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-400">文書ハッシュ (SHA-256)</div>
                      <div className="text-xs font-mono text-gray-600 break-all mt-0.5">{result.document.document_hash}</div>
                    </div>
                  )}
                  {result.document?.chain_hash && (
                    <div>
                      <div className="text-xs text-gray-400">チェーンハッシュ</div>
                      <div className="text-xs font-mono text-gray-600 break-all mt-0.5">{result.document.chain_hash}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-red-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-red-700 mb-1">検証に失敗しました</div>
              <div className="text-xs text-gray-500">{result?.message || "一致する文書が見つかりませんでした。"}</div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          UNSER Sign 電子署名検証システム
        </p>
      </div>
    </div>
  );
}
