"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { SignatureField, FieldType } from "@/lib/types";
import { FIELD_TYPE_CONFIG } from "@/lib/types";
import { SignatureGenerator } from "@/components/SignatureGenerator";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type SignatureData =
  | { type: "typed"; text: string }
  | { type: "drawing"; dataUrl: string }
  | { type: "stamp"; dataUrl: string };

export function SignForm({
  documentId,
  documentTitle,
  signerId,
  token,
  pdfUrl,
  fields,
  signerName,
  companyName,
}: {
  documentId: string;
  documentTitle: string;
  signerId: string;
  token: string | null;
  pdfUrl: string | null;
  fields: SignatureField[];
  signerName: string;
  companyName?: string;
}) {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [showSignatureGen, setShowSignatureGen] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(600);
  const router = useRouter();

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
  const requiredCount = fields.length;

  // Scroll PDF to show a specific field
  function scrollToField(f: SignatureField) {
    if (f.page !== currentPage) {
      setCurrentPage(f.page);
    }
    setActiveFieldId(f.id);
    // Open appropriate modal/input for the field
    if (f.field_type === "signature" || f.field_type === "stamp") {
      setShowSignatureGen(true);
    } else if (f.field_type === "checkbox") {
      updateFieldValue(f.id, fieldValues[f.id] === "true" ? "" : "true");
    }
    // Scroll the PDF container
    setTimeout(() => {
      const el = document.getElementById(`field-overlay-${f.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

  async function handleSubmit() {
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
        body: JSON.stringify({ documentId, signerId, token, signature, fieldValues }),
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

  function renderFieldOverlay(f: SignatureField) {
    const isActive = activeFieldId === f.id;
    const complete = isFieldComplete(f);
    const config = FIELD_TYPE_CONFIG[f.field_type];

    const baseClasses = `absolute rounded cursor-pointer transition-all ${
      complete
        ? "border-2 border-green-400 bg-green-50/80"
        : isActive
        ? "border-2 border-blue-500 bg-blue-50/90 ring-2 ring-blue-300 shadow-lg z-20"
        : "border-2 border-red-400 bg-red-50/60 hover:bg-red-100/70 hover:shadow-md"
    }`;

    return (
      <div
        key={f.id}
        id={`field-overlay-${f.id}`}
        className={baseClasses}
        style={{
          left: `${f.x}%`,
          top: `${f.y}%`,
          width: `${f.width}%`,
          height: `${f.height}%`,
          zIndex: isActive ? 30 : complete ? 15 : 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          scrollToField(f);
        }}
      >
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
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[10px] font-medium text-red-600 select-none flex items-center gap-0.5">
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const pageFields = fields.filter((f) => f.page === currentPage);

  // Get checklist-style field label
  function getFieldLabel(f: SignatureField, index: number): string {
    const config = FIELD_TYPE_CONFIG[f.field_type];
    return f.label || `${config.label}${fields.filter((ff) => ff.field_type === f.field_type).length > 1 ? index + 1 : ""}`;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top header bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[300px]">{documentTitle}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>その他のメニュー</span>
        </div>
      </div>

      {/* Guide modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">UNSER Signの使い方</h2>
              <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 pb-6 space-y-5">
              {[
                { num: 1, title: "受信した文書の内容を確認", desc: "スクロールして、受信した文書の内容を確認してください。" },
                { num: 2, title: "チェックリストを完了", desc: "チェックリストの内容を押すと該当箇所へ移動します。すべてに記入・署名をしてください。" },
                { num: 3, title: "完成した文書を確認", desc: "すべてに記入・署名が終わりましたら「完了する」ボタンを押します。" },
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-700 text-sm">{step.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout: sidebar + PDF */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Checklist */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="text-sm font-bold text-gray-900">文書1 (1/1)</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">電子署名</span>
              <span className="text-xs text-gray-500 truncate">{documentTitle}</span>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-500">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <span className="text-sm font-bold text-gray-700">チェックリスト</span>
            </div>
            <p className="text-xs text-gray-400">項目を押すと該当箇所へ移動します。</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {fields.map((f, i) => {
              const complete = isFieldComplete(f);
              const config = FIELD_TYPE_CONFIG[f.field_type];
              const isActive = activeFieldId === f.id;
              const fieldIndex = fields.filter((ff, fi) => ff.field_type === f.field_type && fi <= i).length;
              const sameTypeCount = fields.filter((ff) => ff.field_type === f.field_type).length;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => scrollToField(f)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : complete
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "hover:bg-red-50 border border-transparent"
                  }`}
                >
                  {/* Status badge */}
                  <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    complete ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {complete ? "完了" : "必須"}
                  </span>

                  {/* Icon */}
                  <span className="text-base">{config.icon}</span>

                  {/* Label */}
                  <span className={`text-sm truncate ${complete ? "text-gray-500" : "text-gray-800 font-medium"}`}>
                    {config.label}{sameTypeCount > 1 ? fieldIndex : ""}
                  </span>

                  {/* Checkmark */}
                  {complete && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-green-500 ml-auto flex-shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom bar with progress */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                必須項目：<span className={completedCount === requiredCount ? "text-green-600" : "text-blue-600"}>{completedCount}</span>/{requiredCount}件
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !allFieldsComplete}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                allFieldsComplete
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "送信中..." : "完了する"}
            </button>
          </div>
        </div>

        {/* PDF viewer area */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-4">
          {error && (
            <div className="mb-4 mx-auto max-w-3xl rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {pdfUrl && (
            <div className="mx-auto max-w-3xl">
              <div
                ref={pdfContainerRef}
                className="relative bg-white rounded-lg shadow-lg overflow-hidden"
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
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  >
                    &lt; 前へ
                  </button>
                  <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    {currentPage} / {numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  >
                    次へ &gt;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Inline input for active text field */}
          {activeFieldId && (() => {
            const f = fields.find((ff) => ff.id === activeFieldId);
            if (!f || ["signature", "stamp", "checkbox"].includes(f.field_type)) return null;
            const config = FIELD_TYPE_CONFIG[f.field_type];
            return (
              <div className="mx-auto max-w-3xl mt-4">
                <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className="font-bold text-gray-800">{config.label}を入力</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveFieldId(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                      &times;
                    </button>
                  </div>
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
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveFieldId(null)}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      確定
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
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
    </div>
  );
}
