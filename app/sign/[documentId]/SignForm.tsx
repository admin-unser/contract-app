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

/* ------------------------------------------------------------------ */
/*  Inline CSS for pulse animation                                    */
/* ------------------------------------------------------------------ */
const pulseKeyframes = `
@keyframes fieldPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
  50% { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
}
@keyframes subtleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
`;

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
  const [stampData, setStampData] = useState<SignatureData | null>(null);
  const [showSignatureGen, setShowSignatureGen] = useState(false);
  const [signatureGenMode, setSignatureGenMode] = useState<'signature' | 'stamp'>('signature');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
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
    if (f.field_type === "signature") return !!signature;
    if (f.field_type === "stamp") return !!stampData;
    if (f.field_type === "checkbox") return fieldValues[f.id] === "true";
    return !!(fieldValues[f.id]?.trim());
  }

  const allFieldsComplete = fields.every(isFieldComplete);
  const completedCount = fields.filter(isFieldComplete).length;
  const requiredCount = fields.length;
  const progressPercent = requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 0;

  // Scroll PDF to show a specific field
  function scrollToField(f: SignatureField) {
    if (f.page !== currentPage) {
      setCurrentPage(f.page);
    }
    setActiveFieldId(f.id);
    // Open appropriate modal/input for the field
    if (f.field_type === "stamp") {
      setSignatureGenMode('stamp');
      setShowSignatureGen(true);
    } else if (f.field_type === "signature") {
      setSignatureGenMode('signature');
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
    const hasSignatureFields = fields.some(f => f.field_type === "signature");
    const hasStampFields = fields.some(f => f.field_type === "stamp");
    if (hasSignatureFields && !signature) {
      setError("署名を作成してください。");
      return;
    }
    if (hasStampFields && !stampData) {
      setError("印鑑を作成してください。");
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
        body: JSON.stringify({ documentId, signerId, token, signature, stampData, fieldValues }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "署名の保存に失敗しました。");
      }
      router.push(`/sign/success?title=${encodeURIComponent(documentTitle)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Field overlay on the PDF                                        */
  /* ---------------------------------------------------------------- */
  function renderFieldOverlay(f: SignatureField) {
    const isActive = activeFieldId === f.id;
    const isHovered = hoveredFieldId === f.id;
    const complete = isFieldComplete(f);
    const config = FIELD_TYPE_CONFIG[f.field_type];

    return (
      <div
        key={f.id}
        id={`field-overlay-${f.id}`}
        className="absolute rounded-md cursor-pointer transition-all duration-200"
        style={{
          left: `${f.x}%`,
          top: `${f.y}%`,
          width: `${f.width}%`,
          height: `${f.height}%`,
          zIndex: isActive ? 30 : complete ? 15 : 20,
          /* Complete fields */
          ...(complete ? {
            border: '2px solid #22c55e',
            backgroundColor: 'rgba(220, 252, 231, 0.85)',
          } : isActive ? {
            border: '2.5px dashed #3b82f6',
            backgroundColor: 'rgba(219, 234, 254, 0.92)',
            boxShadow: '0 0 0 4px rgba(59,130,246,0.15), 0 4px 12px rgba(59,130,246,0.2)',
          } : {
            border: '2.5px dashed #f59e0b',
            backgroundColor: 'rgba(254, 243, 199, 0.88)',
            animation: 'fieldPulse 2s ease-in-out infinite',
          }),
        }}
        onMouseEnter={() => setHoveredFieldId(f.id)}
        onMouseLeave={() => setHoveredFieldId(null)}
        onClick={(e) => {
          e.stopPropagation();
          scrollToField(f);
        }}
      >
        {complete ? (
          /* ---------- COMPLETE field ---------- */
          <div className="w-full h-full flex items-center justify-center overflow-hidden p-0.5 relative">
            {(f.field_type === "signature") && signature ? (
              signature.type === "typed" ? (
                <span className="text-xs font-semibold text-green-800 truncate">{signature.text}</span>
              ) : (
                <img src={signature.dataUrl} alt="" className="max-w-full max-h-full object-contain" />
              )
            ) : (f.field_type === "stamp") && stampData ? (
              stampData.type === "typed" ? (
                <span className="text-xs font-semibold text-green-800 truncate">{stampData.text}</span>
              ) : (
                <img src={stampData.dataUrl} alt="" className="max-w-full max-h-full object-contain" />
              )
            ) : f.field_type === "checkbox" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-[11px] font-semibold text-green-800 truncate px-1">{fieldValues[f.id]}</span>
            )}
            {/* Green checkmark badge */}
            <div
              className="absolute flex items-center justify-center rounded-full bg-green-500 shadow-sm"
              style={{ top: -6, right: -6, width: 18, height: 18 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        ) : (
          /* ---------- INCOMPLETE field ---------- */
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div className="flex items-center gap-1" style={{ animation: 'subtleBounce 2s ease-in-out infinite' }}>
              <span className="text-sm drop-shadow-sm">{config.icon}</span>
              <span className="text-[11px] font-bold text-amber-800 select-none whitespace-nowrap">
                {config.label}
              </span>
            </div>
            {/* Hover tooltip */}
            {(isHovered || isActive) && (
              <div
                className="absolute left-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-gray-900 text-white text-[9px] font-medium shadow-lg pointer-events-none"
                style={{ bottom: -22, zIndex: 50, transform: 'translateX(-50%)' }}
              >
                クリックして入力
              </div>
            )}
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

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Inject keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />

      {/* ============================================================ */}
      {/*  TOP HEADER BAR                                              */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-5 py-3 flex items-center justify-between">
          {/* Left: logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a365d] to-[#312e81] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-900/20">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 truncate max-w-[180px] md:max-w-[280px] leading-tight">{documentTitle}</span>
              <span className="text-[10px] text-gray-400 font-medium">MUSUBI sign</span>
            </div>
          </div>

          {/* Center: progress bar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent === 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: progressPercent === 100 ? '#16a34a' : '#3b82f6' }}>
              {progressPercent}%
            </span>
          </div>

          {/* Right: help button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              ヘルプ
            </button>
          </div>
        </div>
      </div>

      {/* Guide modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">MUSUBI signの使い方</h2>
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

      {/* ============================================================ */}
      {/*  MAIN LAYOUT: sidebar + PDF                                  */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto md:overflow-hidden">
        {/* ---------------------------------------------------------- */}
        {/*  LEFT SIDEBAR - Checklist                                   */}
        {/* ---------------------------------------------------------- */}
        <div className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0 md:max-h-none md:overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="text-sm font-bold text-gray-900">文書1 (1/1)</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold border border-blue-100">電子署名</span>
              <span className="text-xs text-gray-400 truncate">{documentTitle}</span>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <span className="text-sm font-bold text-gray-800">チェックリスト</span>
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 tabular-nums">
                {completedCount}/{requiredCount}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">項目を押すと該当箇所へ移動します。</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
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
                  className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-50 border-2 border-blue-300 shadow-sm shadow-blue-100"
                      : complete
                      ? "bg-green-50/50 border border-green-100 hover:bg-green-50"
                      : "bg-gray-50 border border-gray-100 hover:bg-amber-50 hover:border-amber-200"
                  }`}
                >
                  {/* Number badge */}
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    complete
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {complete ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>

                  {/* Icon + Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{config.icon}</span>
                      <span className={`text-sm truncate ${complete ? "text-green-700 font-medium" : "text-gray-800 font-semibold"}`}>
                        {config.label}{sameTypeCount > 1 ? fieldIndex : ""}
                      </span>
                    </div>
                    {/* Value preview for completed items */}
                    {complete && f.field_type !== "signature" && f.field_type !== "stamp" && f.field_type !== "checkbox" && fieldValues[f.id] && (
                      <p className="text-[10px] text-green-600/70 truncate mt-0.5 pl-5">
                        {fieldValues[f.id]}
                      </p>
                    )}
                    {complete && f.field_type === "checkbox" && (
                      <p className="text-[10px] text-green-600/70 mt-0.5 pl-5">チェック済み</p>
                    )}
                    {complete && (f.field_type === "signature" || f.field_type === "stamp") && (
                      <p className="text-[10px] text-green-600/70 mt-0.5 pl-5">入力済み</p>
                    )}
                  </div>

                  {/* Status tag */}
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    complete ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-700"
                  }`}>
                    {complete ? "完了" : "必須"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom bar with progress - hidden on mobile, shown in floating bar instead */}
          <div className="hidden md:block p-4 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
            {/* Mini progress bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-gray-500">
                {completedCount}/{requiredCount}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !allFieldsComplete}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                allFieldsComplete
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  送信中...
                </span>
              ) : "完了する"}
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  PDF VIEWER AREA                                            */}
        {/* ---------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-3 md:p-6" style={{ scrollBehavior: 'smooth' }}>
          {error && (
            <div className="mb-4 mx-auto max-w-3xl rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-500">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {pdfUrl && (
            <div className="mx-auto max-w-3xl">
              {/* PDF with paper shadow */}
              <div
                ref={pdfContainerRef}
                className="relative bg-white rounded-lg overflow-hidden"
                style={{
                  minHeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
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

              {/* Page navigation */}
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {/* Thumbnail dots */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: numPages }, (_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`rounded-full transition-all duration-200 ${
                          currentPage === idx + 1
                            ? "w-8 h-2.5 bg-blue-500"
                            : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile submit button */}
          <div className="md:hidden mt-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-gray-600">
                {completedCount}/{requiredCount}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !allFieldsComplete}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 ${
                allFieldsComplete
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "送信中..." : "完了する"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  FLOATING INLINE INPUT PANEL (for text fields)               */}
      {/* ============================================================ */}
      {activeFieldId && (() => {
        const f = fields.find((ff) => ff.id === activeFieldId);
        if (!f || ["signature", "stamp", "checkbox"].includes(f.field_type)) return null;
        const config = FIELD_TYPE_CONFIG[f.field_type];
        return (
          <div className="fixed bottom-0 left-0 md:left-72 right-0 z-40">
            <div className="bg-white border-t-2 border-blue-500 shadow-2xl">
              <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-5">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                      {config.label}
                    </label>
                    <input
                      type={f.field_type === "date" ? "date" : "text"}
                      value={fieldValues[f.id] || ""}
                      onChange={(e) => updateFieldValue(f.id, e.target.value)}
                      autoFocus
                      className="w-full text-base md:text-lg font-medium text-gray-900 border-0 border-b-2 border-gray-200 focus:border-blue-500 bg-transparent py-2 outline-none transition-colors"
                      style={{ boxShadow: 'none' }}
                      placeholder={
                        f.field_type === "name" ? signerName || "お名前を入力" :
                        f.field_type === "company" ? companyName || "会社名を入力" :
                        f.field_type === "address" ? "住所を入力" :
                        f.field_type === "date" ? "" :
                        "テキストを入力"
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFieldId(null)}
                    className="px-5 md:px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex-shrink-0"
                  >
                    確定
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Signature Generator Modal */}
      {showSignatureGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <SignatureGenerator
              signerName={signerName}
              companyName={companyName}
              onComplete={(data) => {
                if (signatureGenMode === 'stamp') {
                  setStampData(data);
                } else {
                  setSignature(data);
                }
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
