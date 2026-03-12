"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { SignatureField, EnvelopeSigner } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FieldDraft {
  id: string;
  signer_id: string;
  page: number;
  x: number; // %
  y: number; // %
  width: number; // %
  height: number; // %
}

const SIGNER_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", hex: "#3b82f6" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-700", hex: "#22c55e" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", hex: "#a855f7" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", hex: "#f97316" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700", hex: "#ec4899" },
];

export default function FieldPlacementPage() {
  const { id: documentId } = useParams<{ id: string }>();
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signers, setSigners] = useState<EnvelopeSigner[]>([]);
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSigner, setSelectedSigner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pdfWidth, setPdfWidth] = useState(600);

  // Measure container width for react-pdf rendering
  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setPdfWidth(containerRef.current.clientWidth);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [loading]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const pdfRes = await fetch(`/api/documents/${documentId}/pdf-url`);
      if (pdfRes.ok) {
        const { url } = await pdfRes.json();
        setPdfUrl(url);
      }

      const docRes = await fetch(`/api/documents/${documentId}/signers`);
      if (docRes.ok) {
        const data = await docRes.json();
        setSigners(data);
        if (data.length > 0) setSelectedSigner(data[0].id);
      }

      const fieldsRes = await fetch(`/api/documents/${documentId}/fields`);
      if (fieldsRes.ok) {
        const data: SignatureField[] = await fieldsRes.json();
        setFields(data.map((f) => ({ ...f, id: f.id })));
      }

      setLoading(false);
    }
    load();
  }, [documentId]);

  function addField() {
    if (!selectedSigner) return;
    const newField: FieldDraft = {
      id: crypto.randomUUID(),
      signer_id: selectedSigner,
      page: currentPage,
      x: 30,
      y: 70,
      width: 25,
      height: 6,
    };
    setFields([...fields, newField]);
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
  }

  const handleMouseDown = useCallback((fieldId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const fieldX = (field.x / 100) * rect.width;
    const fieldY = (field.y / 100) * rect.height;
    setDragOffset({
      x: e.clientX - rect.left - fieldX,
      y: e.clientY - rect.top - fieldY,
    });
    setDragging(fieldId);
  }, [fields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    setFields((prev) =>
      prev.map((f) =>
        f.id === dragging
          ? { ...f, x: Math.max(0, Math.min(100 - f.width, x)), y: Math.max(0, Math.min(100 - f.height, y)) }
          : f
      )
    );
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map((f) => ({
            signer_id: f.signer_id,
            page: f.page,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
          })),
        }),
      });
      if (res.ok) {
        router.push(`/documents/${documentId}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const pageFields = fields.filter((f) => f.page === currentPage);

  function getSignerColor(signerId: string) {
    const idx = signers.findIndex((s) => s.id === signerId);
    return SIGNER_COLORS[idx % SIGNER_COLORS.length];
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">読み込み中...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <Link href={`/documents/${documentId}`} className="hover:text-blue-600 transition-colors">文書詳細</Link>
        <span>/</span>
        <span className="text-gray-800">署名位置設定</span>
      </div>

      <div className="flex gap-6">
        {/* Left: PDF viewer with overlay */}
        <div className="flex-1">
          <div
            ref={containerRef}
            className="relative bg-white rounded-xl border border-gray-200 overflow-hidden select-none"
            style={{ minHeight: 600 }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
                loading={<div className="flex items-center justify-center h-[700px] text-gray-400">PDF読み込み中...</div>}
                error={<div className="flex items-center justify-center h-[700px] text-red-400">PDFの読み込みに失敗しました</div>}
              >
                <Page
                  pageNumber={currentPage}
                  width={pdfWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
            {/* Signature field overlays */}
            {pageFields.map((f) => {
              const color = getSignerColor(f.signer_id);
              const signer = signers.find((s) => s.id === f.signer_id);
              return (
                <div
                  key={f.id}
                  onMouseDown={(e) => handleMouseDown(f.id, e)}
                  className={`absolute border-2 ${color.border} ${color.bg} bg-opacity-50 rounded cursor-move flex items-center justify-center group`}
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    width: `${f.width}%`,
                    height: `${f.height}%`,
                    zIndex: 10,
                  }}
                >
                  <span className={`text-xs font-medium ${color.text} select-none`}>
                    {signer?.name || signer?.email?.split("@")[0] || "署名"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30"
            >
              前のページ
            </button>
            <span className="text-sm text-gray-600">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.max(1, Math.min(totalPages, Number(e.target.value))))}
                className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
                min={1}
                max={totalPages}
              />
              / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30"
            >
              次のページ
            </button>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Signer selection */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">署名者</span>
            </div>
            <div className="p-3 space-y-1">
              {signers.map((s, i) => {
                const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSigner(s.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                      selectedSigner === s.id ? `${color.bg} ${color.text} font-medium` : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color.hex }} />
                    <span className="truncate">{s.name || s.email}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add field */}
          <button
            onClick={addField}
            disabled={!selectedSigner}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            署名欄を追加
          </button>

          {/* Field list */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">配置済み ({fields.length})</span>
            </div>
            <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">署名欄を追加してください</p>
              ) : (
                fields.map((f) => {
                  const signer = signers.find((s) => s.id === f.signer_id);
                  const color = getSignerColor(f.signer_id);
                  return (
                    <div key={f.id} className="flex items-center justify-between text-xs py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                        <span className="text-gray-600 truncate max-w-[120px]">
                          {signer?.name || signer?.email?.split("@")[0]}
                        </span>
                        <span className="text-gray-400">P{f.page}</span>
                      </div>
                      <button
                        onClick={() => removeField(f.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <Link
              href={`/documents/${documentId}`}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
