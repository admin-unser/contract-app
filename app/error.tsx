"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-7 h-7">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        申し訳ありません。予期しないエラーが発生しました。再度お試しいただくか、問題が続く場合はサポートまでご連絡ください。
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-gradient-to-r from-[#1a365d] to-[#312e81] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-all"
        >
          再試行
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          トップページへ
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-gray-300">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
