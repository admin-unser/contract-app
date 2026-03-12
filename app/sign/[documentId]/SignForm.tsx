"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { SignatureField, FieldType } from "@/lib/types";
import { FIELD_TYPE_CONFIG } from "@/lib/types";
import { OtpVerification } from "@/components/OtpVerification";
import { SignatureGenerator } from "@/components/SignatureGenerator";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type SignatureData = { type: "typed"; text: string } | { type: "drawing"; dataUrl: string } | { type: "stamp"; dataUrl: string };

export function SignForm({
  documentId,
  signerId,
  token,
  pdfUrl,
  fields,
  signerName,
  companyName,
  otpVerified: initialOtpVerified,
}: {
  documentId: string;
  signerId: string;
  token: string | null;
  pdfUrl: string | null;
  fields: SignatureField[];
  signerName: string;
  companyName?: string;
  otpVerified: boolean;
}) {
  const [otpDone, setOtpDone] = useState(initialOtpVerified);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [showSignatureGen, setShowSignatureGen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(700);
  const router = useRouter();

  const pageFields = fields.filter((f) => f.page === currentPage);

  // Auto-fill name/company/date fields
  useEffect(() => {
    const auto: Record<string, string> = {};
    for (const f of fields) {
      if (f.field_type === "name" && signerName) auto[f.id] = signerName;
      if (f.field_type === "company" && companyName) auto[f.id] = companyName;
      if (f.field_type === "date") auto[f.id] = new Date().toLocaleDateString("ja-JP");
    }
    setFieldValues((prev) => ({ ...auto, ...prev }));
  }, [fields, signerName, companyName]);

  useEffect(() => {
    function updateWidth() {
      if (pdfContainerRef.current) setPdfWidth(pdfContainerRef.current.clientWidth);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  function updateFieldValue(fieldId: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function isFieldComplete(f: SignatureField): boolean {
    if (f.field_type === "signature" || f.field_type === "stamp") return !!signature;
    if (f.field_type === "checkbox") return fieldValues[f.id] === "true";
    return !!(fieldValues[f.id]?.trim());
  }

  const allFieldsComplete = fields.every(isFieldComplete);
  const completedCount = fields.filter(isFieldComplete).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signature) {
      setError("署名を作成してください。");
      return;
    }
    if (!allFieldsComplete) {
      setError("すべての入力項目を入力してください。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          signerId,
          token,
          signature,
          fieldValues,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "署名の保存に失敗しました。");
      }
      router.push("/sign/success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  if (token && !otpDone) {
    return <OtpVerification token={token} onVerified={() => setOtpDone(true)} />;
  }

  function renderFieldOverlay(f: SignatureField) {
    const isActive = activeFieldId === f.id;
    const complete = isFieldComplete(f);
    const config = FIELD_TYPE_CONFIG[f.field_type];

    const baseClasses = `absolute rounded cursor-pointer transition-all ${
      complete
        ? "border-2 border-green-400 bg-green-50/80"
        : isActive
        ? "border-2 border-blue-500 bg-blue-50/90 ring-2 ring-blue-300 shadow-lg z-20"
        : "border-2 border-blue-400 bg-blue-50/60 hover:bg-blue-100/70 hover:shadow-md animate-pulse"
    }`;

    return (
      <div
        key={f.id}
        className={baseClasses}
        style={{
          left: `${f.x}%`, top: `${f.y}%`,
          width: `${f.width}%`, height: `${f.height}%`,
          zIndex: isActive ? 30 : complete ? 15 : 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (f.field_type === "signature" || f.field_type === "stamp") {
            setShowSignatureGen(true);
          } else if (f.field_type === "checkbox") {
            updateFieldValue(f.id, fieldValues[f.id] === "true" ? "" : "true");
          } else {
            setActiveFieldId(isActive ? null : f.id);
          }
        }}
      >
        {/* Completed content */}
        {complete ? (
          <div className="w-full h-full flex items-center justify-center overflow-hidden p-0.5">
            {(f.field_type === "signature" || f.field_type === "stamp") && signature ? (
              signature.type === "typed" ? (
                <span className="text-xs font-medium text-green-800 truncate">{signature.text}</span>
              ) : (
                <img src={signature.dataUrl} alt="" className="max-w-full max-h-full object-contain" />
              )
            ) : f.field_type === "checkbox" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-[10px] font-medium text-green-800 truncate px-1">{fieldValues[f.id]}</span>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] font-medium text-blue-600 select-none flex items-center gap-0.5">
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Group fields by type for the input panel
  const signatureFields = fields.filter((f) => f.field_type === "signature" || f.field_type === "stamp");
  const inputFields = fields.filter((f) => !["signature", "stamp", "checkbox"].includes(f.field_type));
  const checkboxFields = fields.filter((f) => f.field_type === "checkbox");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-lg bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">入力進捗</span>
          <span className="text-sm text-gray-500">{completedCount} / {fields.length} 完了</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${allFieldsComplete ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${fields.length > 0 ? (completedCount / fields.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* PDF Viewer with field overlays */}
      {pdfUrl && (
        <div>
          <div
            ref={pdfContainerRef}
            className="relative bg-white rounded-lg border border-gray-200 overflow-hidden"
            style={{ minHeight: 500 }}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              loading={<div className="flex items-center justify-center h-[600px] text-gray-400">PDF読み込み中...</div>}
              error={<div className="flex items-center justify-center h-[600px] text-red-400">PDFの読み込みに失敗しました</div>}
            >
              <Page pageNumber={currentPage} width={pdfWidth} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
            {pageFields.map(renderFieldOverlay)}
          </div>

          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30">前のページ</button>
              <span className="text-sm text-gray-600">{currentPage} / {numPages}</span>
              <button type="button" onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages} className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30">次のページ</button>
            </div>
          )}
        </div>
      )}
      {!pdfUrl && (
        <p className="text-sm text-amber-600">プレビューを読み込めませんでした。署名は可能です。</p>
      )}

      {/* Input fields panel */}
      {inputFields.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">入力項目</h2>
            <p className="text-xs text-gray-500 mt-0.5">各項目を入力してください。PDF上の対応する位置に反映されます。</p>
          </div>
          <div className="p-5 space-y-3">
            {inputFields.map((f) => {
              const config = FIELD_TYPE_CONFIG[f.field_type];
              return (
                <div key={f.id}>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    {isFieldComplete(f) && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-green-500">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </label>
                  <input
                    type={f.field_type === "date" ? "date" : "text"}
                    value={fieldValues[f.id] || ""}
                    onChange={(e) => updateFieldValue(f.id, e.target.value)}
                    placeholder={
                      f.field_type === "name" ? signerName || "お名前" :
                      f.field_type === "company" ? companyName || "会社名" :
                      f.field_type === "address" ? "住所を入力" :
                      f.field_type === "date" ? "" :
                      "テキストを入力"
                    }
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors ${
                      isFieldComplete(f)
                        ? "border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Checkbox fields */}
      {checkboxFields.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">確認事項</h2>
          </div>
          <div className="p-5 space-y-2">
            {checkboxFields.map((f) => (
              <label key={f.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fieldValues[f.id] === "true"}
                  onChange={(e) => updateFieldValue(f.id, e.target.checked ? "true" : "")}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{f.label || "確認しました"}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Signature section */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">署名</h2>
            <p className="text-xs text-gray-500 mt-0.5">{signatureFields.length > 0 ? `${signatureFields.length}件の署名欄に適用されます` : "署名を作成してください"}</p>
          </div>
          {signature && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              作成済み
            </span>
          )}
        </div>
        <div className="p-5">
          {signature ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                {signature.type === "typed" ? (
                  <div className="flex-1 text-lg font-medium text-gray-800 text-center" style={{ fontFamily: "serif" }}>
                    {signature.text}
                  </div>
                ) : (
                  <div className="flex-1 flex justify-center">
                    <img src={signature.dataUrl} alt="署名" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSignature(null); setShowSignatureGen(true); }}
                className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                署名を変更する
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignatureGen(true)}
              className="w-full rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 py-8 text-blue-600 font-medium text-sm transition-all flex flex-col items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              署名を作成する
            </button>
          )}
        </div>
      </div>

      {/* Signature Generator Modal */}
      {showSignatureGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <SignatureGenerator
              signerName={signerName}
              companyName={companyName}
              onComplete={(data) => {
                setSignature(data);
                setShowSignatureGen(false);
              }}
              onCancel={() => setShowSignatureGen(false)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !signature || !allFieldsComplete}
        className={`w-full rounded-lg py-3.5 font-medium text-white text-sm transition-all ${
          loading || !signature || !allFieldsComplete
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
        }`}
      >
        {loading ? "送信中..." : allFieldsComplete && signature ? "署名して完了する" : "すべての項目を入力してください"}
      </button>
    </form>
  );
}
