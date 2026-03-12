"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { SignatureField } from "@/lib/types";
import { OtpVerification } from "@/components/OtpVerification";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type SignatureData = { type: "typed"; text: string } | { type: "drawing"; dataUrl: string };

export function SignForm({
  documentId,
  signerId,
  token,
  pdfUrl,
  fields,
  signerName,
  otpVerified: initialOtpVerified,
}: {
  documentId: string;
  signerId: string;
  token: string | null;
  pdfUrl: string | null;
  fields: SignatureField[];
  signerName: string;
  otpVerified: boolean;
}) {
  const [otpDone, setOtpDone] = useState(initialOtpVerified);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [typedName, setTypedName] = useState("");
  const [useDrawing, setUseDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(700);
  const router = useRouter();

  const hasFields = fields.length > 0;
  const pageFields = fields.filter((f) => f.page === currentPage);

  // Measure container width for react-pdf
  useEffect(() => {
    function updateWidth() {
      if (pdfContainerRef.current) {
        setPdfWidth(pdfContainerRef.current.clientWidth);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    },
    [isDrawing]
  );

  const endDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignature({ type: "drawing", dataUrl });
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  }

  const submitTyped = () => {
    const t = typedName.trim();
    if (!t) return;
    setSignature({ type: "typed", text: t });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signature) {
      setError("署名を入力するか、描画してください。");
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

  // OTP verification step (only when token-based auth)
  if (token && !otpDone) {
    return (
      <OtpVerification token={token} onVerified={() => setOtpDone(true)} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              <Page
                pageNumber={currentPage}
                width={pdfWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            {/* Signature field overlays */}
            {pageFields.map((f) => (
              <div
                key={f.id}
                className={`absolute border-2 rounded flex items-center justify-center ${
                  signature
                    ? "border-green-400 bg-green-50 bg-opacity-70"
                    : "border-blue-400 bg-blue-50 bg-opacity-50 animate-pulse"
                }`}
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                  width: `${f.width}%`,
                  height: `${f.height}%`,
                  zIndex: 10,
                }}
              >
                {signature ? (
                  signature.type === "typed" ? (
                    <span className="text-xs font-medium text-green-700 select-none truncate px-1">
                      {signature.text}
                    </span>
                  ) : (
                    <img
                      src={signature.dataUrl}
                      alt="署名"
                      className="max-w-full max-h-full object-contain"
                    />
                  )
                ) : (
                  <span className="text-xs font-medium text-blue-600 select-none">
                    ここに署名
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Page navigation */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30"
              >
                前のページ
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
                className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30"
              >
                次のページ
              </button>
            </div>
          )}
        </div>
      )}
      {!pdfUrl && (
        <p className="text-sm text-amber-600">プレビューを読み込めませんでした。署名は可能です。</p>
      )}

      {/* Signature input */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">署名</h2>
        </div>
        <div className="p-5">
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => { setUseDrawing(false); setSignature(null); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !useDrawing ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              名前を入力
            </button>
            <button
              type="button"
              onClick={() => { setUseDrawing(true); setSignature(null); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                useDrawing ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              手書き
            </button>
          </div>

          {!useDrawing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={signerName}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={submitTyped}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors"
              >
                反映
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  className="w-full cursor-crosshair rounded-lg border border-gray-300 bg-white"
                  style={{ touchAction: "none" }}
                />
                {signature && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 rounded-lg bg-white border border-gray-300 px-2 py-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    クリア
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">マウスで署名を描いてください。</p>
            </div>
          )}

          {signature && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {signature.type === "typed" ? `署名: ${signature.text}` : "手書き署名を描画しました"}
            </div>
          )}
        </div>
      </div>

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
        disabled={loading || !signature}
        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
      >
        {loading ? "送信中..." : "署名して完了"}
      </button>
    </form>
  );
}
