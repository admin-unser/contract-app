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
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", hex: "#3b82f6", ring: "ring-blue-400" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-700", hex: "#22c55e", ring: "ring-green-400" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", hex: "#a855f7", ring: "ring-purple-400" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", hex: "#f97316", ring: "ring-orange-400" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700", hex: "#ec4899", ring: "ring-pink-400" },
];

const DEFAULT_FIELD_WIDTH = 20; // %
const DEFAULT_FIELD_HEIGHT = 5; // %
const MIN_FIELD_WIDTH = 8;
const MIN_FIELD_HEIGHT = 3;

type InteractionMode = "idle" | "dragging" | "resizing";
type ResizeHandle = "se" | "sw" | "ne" | "nw" | "e" | "w" | "s" | "n";

export default function FieldPlacementPage() {
  const { id: documentId } = useParams<{ id: string }>();
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signers, setSigners] = useState<EnvelopeSigner[]>([]);
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSigner, setSelectedSigner] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(600);

  // Interaction state
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const interactionStart = useRef<{ mouseX: number; mouseY: number; field: FieldDraft } | null>(null);

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

  // Click on PDF to place a new field
  function handlePdfClick(e: React.MouseEvent) {
    if (mode !== "idle" || !selectedSigner) return;
    // Don't add field if clicking on an existing field
    if ((e.target as HTMLElement).closest("[data-field-id]")) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Center the field at click position
    const x = Math.max(0, Math.min(100 - DEFAULT_FIELD_WIDTH, xPct - DEFAULT_FIELD_WIDTH / 2));
    const y = Math.max(0, Math.min(100 - DEFAULT_FIELD_HEIGHT, yPct - DEFAULT_FIELD_HEIGHT / 2));

    const newField: FieldDraft = {
      id: crypto.randomUUID(),
      signer_id: selectedSigner,
      page: currentPage,
      x,
      y,
      width: DEFAULT_FIELD_WIDTH,
      height: DEFAULT_FIELD_HEIGHT,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }

  // Drag start
  const handleFieldMouseDown = useCallback((fieldId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    setSelectedFieldId(fieldId);
    setMode("dragging");
    setActiveFieldId(fieldId);
    interactionStart.current = { mouseX: e.clientX, mouseY: e.clientY, field: { ...field } };
  }, [fields]);

  // Resize start
  const handleResizeMouseDown = useCallback((fieldId: string, handle: ResizeHandle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    setSelectedFieldId(fieldId);
    setMode("resizing");
    setActiveFieldId(fieldId);
    setResizeHandle(handle);
    interactionStart.current = { mouseX: e.clientX, mouseY: e.clientY, field: { ...field } };
  }, [fields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === "idle" || !activeFieldId || !interactionStart.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dx = ((e.clientX - interactionStart.current.mouseX) / rect.width) * 100;
    const dy = ((e.clientY - interactionStart.current.mouseY) / rect.height) * 100;
    const orig = interactionStart.current.field;

    if (mode === "dragging") {
      const newX = Math.max(0, Math.min(100 - orig.width, orig.x + dx));
      const newY = Math.max(0, Math.min(100 - orig.height, orig.y + dy));
      setFields((prev) =>
        prev.map((f) => f.id === activeFieldId ? { ...f, x: newX, y: newY } : f)
      );
    } else if (mode === "resizing" && resizeHandle) {
      let { x, y, width, height } = orig;

      // Handle resize based on which handle is dragged
      if (resizeHandle.includes("e")) {
        width = Math.max(MIN_FIELD_WIDTH, orig.width + dx);
        if (x + width > 100) width = 100 - x;
      }
      if (resizeHandle.includes("w")) {
        const newWidth = Math.max(MIN_FIELD_WIDTH, orig.width - dx);
        const newX = orig.x + orig.width - newWidth;
        if (newX >= 0) { x = newX; width = newWidth; }
      }
      if (resizeHandle.includes("s")) {
        height = Math.max(MIN_FIELD_HEIGHT, orig.height + dy);
        if (y + height > 100) height = 100 - y;
      }
      if (resizeHandle.includes("n")) {
        const newHeight = Math.max(MIN_FIELD_HEIGHT, orig.height - dy);
        const newY = orig.y + orig.height - newHeight;
        if (newY >= 0) { y = newY; height = newHeight; }
      }

      setFields((prev) =>
        prev.map((f) => f.id === activeFieldId ? { ...f, x, y, width, height } : f)
      );
    }
  }, [mode, activeFieldId, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setMode("idle");
    setActiveFieldId(null);
    setResizeHandle(null);
    interactionStart.current = null;
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedFieldId && !(e.target instanceof HTMLInputElement)) {
          removeField(selectedFieldId);
        }
      }
      if (e.key === "Escape") {
        setSelectedFieldId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFieldId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <Link href={`/documents/${documentId}`} className="hover:text-blue-600 transition-colors">文書詳細</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">署名位置設定</span>
      </div>

      {/* Instruction banner */}
      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <div className="text-sm text-blue-800">
          <p className="font-medium">署名位置の設定方法</p>
          <p className="mt-0.5 text-blue-600">
            右側で署名者を選択し、PDF上の配置したい場所をクリックして署名欄を追加します。
            配置後はドラッグで移動、角や辺のハンドルでサイズ変更が可能です。
            <span className="text-blue-500">（Delete/Backspaceキーで選択中のフィールドを削除）</span>
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: PDF viewer with overlay */}
        <div className="flex-1 min-w-0">
          <div
            ref={containerRef}
            className={`relative bg-white rounded-xl border border-gray-200 overflow-hidden select-none ${
              selectedSigner ? "cursor-crosshair" : ""
            }`}
            style={{ minHeight: 600 }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handlePdfClick}
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
              const isSelected = selectedFieldId === f.id;
              const isActive = activeFieldId === f.id;

              return (
                <div
                  key={f.id}
                  data-field-id={f.id}
                  onMouseDown={(e) => handleFieldMouseDown(f.id, e)}
                  className={`absolute border-2 ${color.border} ${color.bg} bg-opacity-60 rounded cursor-move flex items-center justify-center transition-shadow ${
                    isSelected ? `ring-2 ${color.ring} ring-offset-1 shadow-lg` : "hover:shadow-md"
                  } ${isActive ? "opacity-80" : ""}`}
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    width: `${f.width}%`,
                    height: `${f.height}%`,
                    zIndex: isSelected ? 20 : 10,
                  }}
                >
                  <span className={`text-xs font-medium ${color.text} select-none pointer-events-none`}>
                    {signer?.name || signer?.email?.split("@")[0] || "署名"}
                  </span>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 hover:bg-red-600 group-hover:opacity-100 transition-all shadow-sm"
                    style={{ opacity: isSelected ? 1 : undefined }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    &times;
                  </button>

                  {/* Resize handles (only show when selected) */}
                  {isSelected && (
                    <>
                      {/* Corner handles */}
                      {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
                        <div
                          key={handle}
                          onMouseDown={(e) => handleResizeMouseDown(f.id, handle, e)}
                          className="absolute w-3 h-3 bg-white border-2 rounded-sm shadow-sm z-20"
                          style={{
                            borderColor: color.hex,
                            cursor: handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize",
                            ...(handle.includes("n") ? { top: -5 } : { bottom: -5 }),
                            ...(handle.includes("w") ? { left: -5 } : { right: -5 }),
                          }}
                        />
                      ))}
                      {/* Edge handles */}
                      {(["n", "s", "e", "w"] as ResizeHandle[]).map((handle) => (
                        <div
                          key={handle}
                          onMouseDown={(e) => handleResizeMouseDown(f.id, handle, e)}
                          className="absolute bg-white border-2 rounded-sm shadow-sm z-20"
                          style={{
                            borderColor: color.hex,
                            cursor: handle === "n" || handle === "s" ? "ns-resize" : "ew-resize",
                            ...(handle === "n" ? { top: -4, left: "50%", transform: "translateX(-50%)", width: 12, height: 6 } : {}),
                            ...(handle === "s" ? { bottom: -4, left: "50%", transform: "translateX(-50%)", width: 12, height: 6 } : {}),
                            ...(handle === "e" ? { right: -4, top: "50%", transform: "translateY(-50%)", width: 6, height: 12 } : {}),
                            ...(handle === "w" ? { left: -4, top: "50%", transform: "translateY(-50%)", width: 6, height: 12 } : {}),
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}

            {/* Click hint overlay (only when no fields and a signer is selected) */}
            {pageFields.length === 0 && selectedSigner && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black bg-opacity-5 rounded-xl px-8 py-6 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-gray-400 mx-auto mb-2">
                    <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">ここをクリックして署名欄を配置</p>
                </div>
              </div>
            )}
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-colors"
            >
              &larr; 前のページ
            </button>
            <span className="text-sm text-gray-600 flex items-center gap-1.5">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.max(1, Math.min(totalPages, Number(e.target.value))))}
                className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={1}
                max={totalPages}
              />
              <span className="text-gray-400">/</span>
              <span>{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-colors"
            >
              次のページ &rarr;
            </button>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Signer selection */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">署名者を選択</span>
            </div>
            <div className="p-3 space-y-1">
              {signers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">
                  署名者が登録されていません。
                  <br />
                  <Link href={`/documents/${documentId}`} className="text-blue-500 hover:underline">
                    文書詳細に戻る
                  </Link>
                </p>
              ) : (
                signers.map((s, i) => {
                  const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
                  const fieldCount = fields.filter((f) => f.signer_id === s.id).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSigner(s.id)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-all flex items-center gap-2.5 ${
                        selectedSigner === s.id
                          ? `${color.bg} ${color.text} font-medium ring-1 ${color.ring}`
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white" style={{ backgroundColor: color.hex }} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{s.name || s.email}</div>
                        {s.company_name && (
                          <div className="text-xs text-gray-400 truncate">{s.company_name}</div>
                        )}
                      </div>
                      {fieldCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                          {fieldCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Field list */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">署名欄一覧</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{fields.length}件</span>
            </div>
            <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  PDF上をクリックして
                  <br />
                  署名欄を追加してください
                </p>
              ) : (
                fields.map((f) => {
                  const signer = signers.find((s) => s.id === f.signer_id);
                  const color = getSignerColor(f.signer_id);
                  const isSelected = selectedFieldId === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFieldId(f.id);
                        setCurrentPage(f.page);
                      }}
                      className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? `${color.bg} ${color.border} border` : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.hex }} />
                        <span className="text-gray-700 truncate max-w-[100px]">
                          {signer?.name || signer?.email?.split("@")[0]}
                        </span>
                        <span className="text-gray-400 flex-shrink-0">P{f.page}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
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

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full rounded-lg font-medium py-3 px-4 text-sm transition-all ${
                saveSuccess
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  保存中...
                </span>
              ) : saveSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  保存しました
                </span>
              ) : (
                "保存"
              )}
            </button>
            <Link
              href={`/documents/${documentId}`}
              className="w-full block text-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              文書詳細に戻る
            </Link>
          </div>

          {/* Selected field info */}
          {selectedFieldId && (() => {
            const field = fields.find((f) => f.id === selectedFieldId);
            if (!field) return null;
            const signer = signers.find((s) => s.id === field.signer_id);
            const color = getSignerColor(field.signer_id);
            return (
              <div className={`rounded-xl border-2 ${color.border} bg-white overflow-hidden`}>
                <div className={`px-4 py-2.5 ${color.bg} border-b ${color.border}`}>
                  <span className={`text-xs font-semibold ${color.text}`}>選択中のフィールド</span>
                </div>
                <div className="p-3 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>署名者</span>
                    <span className="font-medium text-gray-800">{signer?.name || signer?.email?.split("@")[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ページ</span>
                    <span className="font-medium text-gray-800">{field.page}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>位置</span>
                    <span className="font-medium text-gray-800">
                      ({field.x.toFixed(1)}%, {field.y.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>サイズ</span>
                    <span className="font-medium text-gray-800">
                      {field.width.toFixed(1)}% &times; {field.height.toFixed(1)}%
                    </span>
                  </div>
                  <button
                    onClick={() => removeField(selectedFieldId)}
                    className="w-full mt-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 py-1.5 text-xs font-medium transition-colors"
                  >
                    このフィールドを削除
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
