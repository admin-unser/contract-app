"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "署名済み文書";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">U</div>
            <span className="text-xl font-bold text-gray-800">UNSER Sign</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="40" height="40" className="w-10 h-10">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">署名が完了しました</h1>
            <p className="text-green-100 text-sm mt-2">すべての入力項目が正常に記録されました</p>
          </div>

          {/* Document info */}
          <div className="px-8 py-6 space-y-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" width="20" height="20" className="w-5 h-5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">署名済み文書</p>
                  <p className="font-bold text-gray-900">{title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14" className="w-3.5 h-3.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>署名日時: {new Date().toLocaleString("ja-JP")}</span>
              </div>
            </div>

            {/* Next steps */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">次のステップ</h3>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">送信者に通知されます</p>
                  <p className="text-xs text-gray-500 mt-0.5">署名完了の通知が送信者にメールで届きます</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">署名済み文書が保管されます</p>
                  <p className="text-xs text-gray-500 mt-0.5">署名データは暗号化ハッシュで保護・保管されます</p>
                </div>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" width="20" height="20" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xs font-medium text-gray-500">UNSER Sign による電子署名で保護されています</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          このページは閉じて問題ありません。
        </p>
      </div>
    </div>
  );
}

export default function SignSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
