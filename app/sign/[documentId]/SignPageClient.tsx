"use client";

import { useState } from "react";
import type { SignatureField } from "@/lib/types";
import { SignForm } from "./SignForm";

interface SignPageClientProps {
  documentId: string;
  documentTitle: string;
  signerId: string;
  token: string | null;
  pdfUrl: string | null;
  fields: SignatureField[];
  signerName: string;
  signerEmail: string;
  companyName?: string;
  senderName: string;
  createdAt: string;
}

export function SignPageClient({
  documentId,
  documentTitle,
  signerId,
  token,
  pdfUrl,
  fields,
  signerName,
  signerEmail,
  companyName,
  senderName,
  createdAt,
}: SignPageClientProps) {
  const [started, setStarted] = useState(false);

  // Landing page - like GMO Sign
  if (!started) {
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 30);
    const deadlineStr = deadline.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                U
              </div>
              <span className="text-xl font-bold text-gray-800">UNSER Sign</span>
            </div>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">署名依頼が届いています</h1>
              <p className="text-sm text-gray-500">文書の内容を確認のうえ、署名をお願いいたします。</p>
            </div>

            <div className="mx-8 rounded-xl bg-gray-50 border border-gray-200 p-5 space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 text-lg">{documentTitle}</h2>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <span className="font-medium text-gray-500">送信者</span>
                <span className="text-gray-900">{senderName}</span>
                <span className="font-medium text-gray-500">文書</span>
                <span className="text-gray-900">{documentTitle}</span>
                <span className="font-medium text-gray-500">署名期限</span>
                <span className="text-gray-900">{deadlineStr} 23:59:00</span>
              </div>
            </div>

            <div className="px-8 py-6 space-y-4">
              <p className="text-xs text-gray-500">
                以下をご確認のうえ、「署名をはじめる」ボタンを押してください。
              </p>
              <button
                onClick={() => setStarted(true)}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98]"
              >
                署名をはじめる
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by UNSER Sign
          </p>
        </div>
      </div>
    );
  }

  // Main signing view
  return (
    <SignForm
      documentId={documentId}
      documentTitle={documentTitle}
      signerId={signerId}
      token={token}
      pdfUrl={pdfUrl}
      fields={fields}
      signerName={signerName}
      companyName={companyName}
    />
  );
}
