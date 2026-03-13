"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { SignatureField, EnvelopeSigner } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Field Type Definitions ───
type FieldType = "signature" | "name" | "company" | "address" | "date" | "stamp" | "text" | "checkbox";

interface FieldTypeConfig {
  type: FieldType;
  label: string;
  icon: string; // SVG path
  defaultWidth: number; // %
  defaultHeight: number; // %
}

const FIELD_TYPES: FieldTypeConfig[] = [
  { type: "signature", label: "署名", icon: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z", defaultWidth: 22, defaultHeight: 6 },
  { type: "name", label: "氏名", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", defaultWidth: 20, defaultHeight: 4 },
  { type: "company", label: "会社名", icon: "M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01M6 7V3h12v4", defaultWidth: 22, defaultHeight: 4 },
  { type: "address", label: "住所", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", defaultWidth: 28, defaultHeight: 4 },
  { type: "date", label: "日付", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", defaultWidth: 16, defaultHeight: 4 },
  { type: "stamp", label: "印影", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2", defaultWidth: 10, defaultHeight: 10 },
  { type: "text", label: "テキスト", icon: "M4 7V4h16v3M9 20h6M12 4v16", defaultWidth: 20, defaultHeight: 4 },
  { type: "checkbox", label: "チェック", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", defaultWidth: 4, defaultHeight: 4 },
];

const FIELD_LABEL_MAP: Record<FieldType, string> = {
  signature: "署名",
  name: "氏名",
  company: "会社名",
  address: "住所",
  date: "日付",
  stamp: "印影",
  text: "テキスト",
  checkbox: "チェック",
};

// ─── Field Draft Interface ───
interface FieldDraft {
  id: string;
  signer_id: string;
  page: number;
  x: number; // %
  y: number; // %
  width: number; // %
  height: number; // %
  field_type: FieldType;
  label: string;
}

const SIGNER_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", hex: "#3b82f6", ring: "ring-blue-400", light: "#dbeafe", accent: "#2563eb" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-700", hex: "#22c55e", ring: "ring-green-400", light: "#dcfce7", accent: "#16a34a" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", hex: "#a855f7", ring: "ring-purple-400", light: "#f3e8ff", accent: "#9333ea" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", hex: "#f97316", ring: "ring-orange-400", light: "#ffedd5", accent: "#ea580c" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700", hex: "#ec4899", ring: "ring-pink-400", light: "#fce7f3", accent: "#db2777" },
];

const MIN_FIELD_WIDTH = 4;
const MIN_FIELD_HEIGHT = 3;

type InteractionMode = "idle" | "dragging" | "resizing" | "dropping";
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState(600);

  // Interaction state
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const interactionStart = useRef<{ mouseX: number; mouseY: number; field: FieldDraft } | null>(null);

  // Drag-from-palette state
  const [draggingFieldType, setDraggingFieldType] = useState<FieldType | null>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);

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
        setFields(data.map((f) => ({
          id: f.id,
          signer_id: f.signer_id,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          field_type: (f.field_type as FieldType) || "signature",
          label: f.label || FIELD_LABEL_MAP[(f.field_type as FieldType) || "signature"],
        })));
      }

      setLoading(false);
    }
    load();
  }, [documentId]);

  // ─── Palette Drag Handlers ───
  function handlePaletteDragStart(fieldType: FieldType) {
    if (!selectedSigner) return;
    setDraggingFieldType(fieldType);
    setMode("dropping");
  }

  function handleContainerDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setDropPreview({ x: xPct, y: yPct });
  }

  function handleContainerDragLeave() {
    setDropPreview(null);
  }

  function handleContainerDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingFieldType || !selectedSigner) {
      setDraggingFieldType(null);
      setDropPreview(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const config = FIELD_TYPES.find(ft => ft.type === draggingFieldType)!;

    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.max(0, Math.min(100 - config.defaultWidth, xPct - config.defaultWidth / 2));
    const y = Math.max(0, Math.min(100 - config.defaultHeight, yPct - config.defaultHeight / 2));

    const newField: FieldDraft = {
      id: crypto.randomUUID(),
      signer_id: selectedSigner,
      page: currentPage,
      x, y,
      width: config.defaultWidth,
      height: config.defaultHeight,
      field_type: draggingFieldType,
      label: FIELD_LABEL_MAP[draggingFieldType],
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setDraggingFieldType(null);
    setDropPreview(null);
    setMode("idle");
  }

  // ─── Click-to-place (fallback) ───
  function handlePdfClick(e: React.MouseEvent) {
    if (mode !== "idle" || !selectedSigner) return;
    if ((e.target as HTMLElement).closest("[data-field-id]")) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const fieldType: FieldType = "signature";
    const config = FIELD_TYPES.find(ft => ft.type === fieldType)!;

    const x = Math.max(0, Math.min(100 - config.defaultWidth, xPct - config.defaultWidth / 2));
    const y = Math.max(0, Math.min(100 - config.defaultHeight, yPct - config.defaultHeight / 2));

    const newField: FieldDraft = {
      id: crypto.randomUUID(),
      signer_id: selectedSigner,
      page: currentPage,
      x, y,
      width: config.defaultWidth,
      height: config.defaultHeight,
      field_type: fieldType,
      label: FIELD_LABEL_MAP[fieldType],
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }

  function removeField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }

  // ─── Field Drag ───
  const handleFieldMouseDown = useCallback((fieldId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    setSelectedFieldId(fieldId);
    setMode("dragging");
    setActiveFieldId(fieldId);
    interactionStart.current = { mouseX: e.clientX, mouseY: e.clientY, field: { ...field } };
  }, [fields]);

  // ─── Field Resize ───
  const handleResizeMouseDown = useCallback((fieldId: string, handle: ResizeHandle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    setSelectedFieldId(fieldId);
    setMode("resizing");
    setActiveFieldId(fieldId);
    setResizeHandle(handle);
    interactionStart.current = { mouseX: e.clientX, mouseY: e.clientY, field: { ...field } };
  }, [fields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if ((mode !== "dragging" && mode !== "resizing") || !activeFieldId || !interactionStart.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dx = ((e.clientX - interactionStart.current.mouseX) / rect.width) * 100;
    const dy = ((e.clientY - interactionStart.current.mouseY) / rect.height) * 100;
    const orig = interactionStart.current.field;

    if (mode === "dragging") {
      const newX = Math.max(0, Math.min(100 - orig.width, orig.x + dx));
      const newY = Math.max(0, Math.min(100 - orig.height, orig.y + dy));
      setFields(prev => prev.map(f => f.id === activeFieldId ? { ...f, x: newX, y: newY } : f));
    } else if (mode === "resizing" && resizeHandle) {
      let { x, y, width, height } = orig;
      if (resizeHandle.includes("e")) { width = Math.max(MIN_FIELD_WIDTH, orig.width + dx); if (x + width > 100) width = 100 - x; }
      if (resizeHandle.includes("w")) { const nw = Math.max(MIN_FIELD_WIDTH, orig.width - dx); const nx = orig.x + orig.width - nw; if (nx >= 0) { x = nx; width = nw; } }
      if (resizeHandle.includes("s")) { height = Math.max(MIN_FIELD_HEIGHT, orig.height + dy); if (y + height > 100) height = 100 - y; }
      if (resizeHandle.includes("n")) { const nh = Math.max(MIN_FIELD_HEIGHT, orig.height - dy); const ny = orig.y + orig.height - nh; if (ny >= 0) { y = ny; height = nh; } }
      setFields(prev => prev.map(f => f.id === activeFieldId ? { ...f, x, y, width, height } : f));
    }
  }, [mode, activeFieldId, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setMode("idle");
    setActiveFieldId(null);
    setResizeHandle(null);
    interactionStart.current = null;
  }, []);

  // ─── Save ───
  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map(f => ({
            signer_id: f.signer_id,
            page: f.page,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            field_type: f.field_type,
            label: f.label,
          })),
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || `保存に失敗しました (${res.status})`);
      }
    } catch {
      setSaveError("保存中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  // ─── Field type change ───
  function updateFieldType(fieldId: string, newType: FieldType) {
    const config = FIELD_TYPES.find(ft => ft.type === newType)!;
    setFields(prev => prev.map(f =>
      f.id === fieldId
        ? { ...f, field_type: newType, label: FIELD_LABEL_MAP[newType], width: config.defaultWidth, height: config.defaultHeight }
        : f
    ));
  }

  // ─── Signer change for field ───
  function updateFieldSigner(fieldId: string, signerId: string) {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, signer_id: signerId } : f));
  }

  const pageFields = fields.filter(f => f.page === currentPage);

  function getSignerColor(signerId: string) {
    const idx = signers.findIndex(s => s.id === signerId);
    return SIGNER_COLORS[idx % SIGNER_COLORS.length];
  }

  function getFieldTypeIcon(fieldType: FieldType) {
    return FIELD_TYPES.find(ft => ft.type === fieldType)?.icon || "";
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedFieldId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
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

  const selectedField = selectedFieldId ? fields.find(f => f.id === selectedFieldId) : null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
          <span>/</span>
          <Link href={`/documents/${documentId}`} className="hover:text-blue-600 transition-colors">文書詳細</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">署名位置設定</span>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>
              保存しました
            </span>
          )}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          <Link
            href={`/documents/${documentId}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            戻る
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />}
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex gap-0 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>

        {/* LEFT: Field type palette */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Signer selector */}
          <div className="p-3 border-b border-gray-100">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">署名者</label>
            <div className="space-y-1">
              {signers.map((s, i) => {
                const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
                const isActive = selectedSigner === s.id;
                const count = fields.filter(f => f.signer_id === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSigner(s.id)}
                    className={`w-full text-left rounded-lg px-2.5 py-2 text-sm transition-all flex items-center gap-2 ${
                      isActive
                        ? `ring-1 font-medium ${color.ring}`
                        : "hover:bg-gray-50"
                    }`}
                    style={isActive ? { backgroundColor: color.light } : {}}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white" style={{ backgroundColor: color.hex }} />
                    <span className="truncate flex-1 text-gray-700">{s.name || s.email?.split("@")[0]}</span>
                    {count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: color.light, color: color.accent }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field type palette */}
          <div className="p-3 flex-1 overflow-y-auto">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">フィールドタイプ</label>
            {!selectedSigner ? (
              <p className="text-xs text-gray-400 text-center py-4">
                まず署名者を選択してください
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {FIELD_TYPES.map(ft => {
                  const signerColor = getSignerColor(selectedSigner);
                  return (
                    <div
                      key={ft.type}
                      draggable
                      onDragStart={() => handlePaletteDragStart(ft.type)}
                      onDragEnd={() => { setDraggingFieldType(null); setDropPreview(null); setMode("idle"); }}
                      className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-2.5 text-xs text-gray-600 cursor-grab active:cursor-grabbing hover:border-gray-300 hover:bg-gray-50 transition-all hover:shadow-sm select-none"
                      style={{ borderLeftWidth: 3, borderLeftColor: signerColor.hex }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400">
                        <path d={ft.icon} />
                      </svg>
                      <span className="font-medium">{ft.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-3 text-center leading-relaxed">
              ドラッグ&ドロップで<br />PDF上に配置
            </p>
          </div>

          {/* Field count summary */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>配置済みフィールド</span>
              <span className="font-bold text-gray-700">{fields.length}件</span>
            </div>
          </div>
        </div>

        {/* CENTER: PDF viewer with overlays */}
        <div className="flex-1 min-w-0 flex flex-col bg-gray-100">
          {/* Page navigation bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="text-sm text-gray-600">
                <input
                  type="number"
                  value={currentPage}
                  onChange={e => setCurrentPage(Math.max(1, Math.min(totalPages, Number(e.target.value))))}
                  className="w-10 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min={1}
                  max={totalPages}
                />
                <span className="mx-1 text-gray-400">/</span>
                <span>{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <div className="text-xs text-gray-400">
              クリックまたはドラッグで配置 · Delete/Backspaceで削除
            </div>
          </div>

          {/* PDF area */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-6">
            <div
              ref={containerRef}
              className={`relative bg-white shadow-lg select-none ${
                selectedSigner ? "cursor-crosshair" : ""
              }`}
              style={{ width: "fit-content" }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handlePdfClick}
              onDragOver={handleContainerDragOver}
              onDragLeave={handleContainerDragLeave}
              onDrop={handleContainerDrop}
            >
              {pdfUrl && (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
                  loading={<div className="flex items-center justify-center h-[700px] w-[600px] text-gray-400">PDF読み込み中...</div>}
                  error={<div className="flex items-center justify-center h-[700px] w-[600px] text-red-400">PDFの読み込みに失敗しました</div>}
                >
                  <Page
                    pageNumber={currentPage}
                    width={Math.min(pdfWidth - 48, 700)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              )}

              {/* Drop preview indicator */}
              {dropPreview && draggingFieldType && selectedSigner && (
                <div
                  className="absolute border-2 border-dashed rounded pointer-events-none"
                  style={{
                    borderColor: getSignerColor(selectedSigner).hex,
                    backgroundColor: getSignerColor(selectedSigner).light,
                    opacity: 0.6,
                    left: `${Math.max(0, dropPreview.x - (FIELD_TYPES.find(ft => ft.type === draggingFieldType)?.defaultWidth || 20) / 2)}%`,
                    top: `${Math.max(0, dropPreview.y - (FIELD_TYPES.find(ft => ft.type === draggingFieldType)?.defaultHeight || 5) / 2)}%`,
                    width: `${FIELD_TYPES.find(ft => ft.type === draggingFieldType)?.defaultWidth || 20}%`,
                    height: `${FIELD_TYPES.find(ft => ft.type === draggingFieldType)?.defaultHeight || 5}%`,
                  }}
                />
              )}

              {/* Drag overlay message */}
              {draggingFieldType && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="bg-blue-600 bg-opacity-10 rounded-xl px-6 py-4 border-2 border-dashed border-blue-400">
                    <p className="text-sm text-blue-700 font-medium">ここにドロップして配置</p>
                  </div>
                </div>
              )}

              {/* Field overlays */}
              {pageFields.map(f => {
                const color = getSignerColor(f.signer_id);
                const signer = signers.find(s => s.id === f.signer_id);
                const isSelected = selectedFieldId === f.id;
                const isActive = activeFieldId === f.id;

                return (
                  <div
                    key={f.id}
                    data-field-id={f.id}
                    onMouseDown={e => handleFieldMouseDown(f.id, e)}
                    className={`absolute border-2 rounded cursor-move flex flex-col items-center justify-center transition-shadow ${
                      isSelected ? "shadow-lg" : "hover:shadow-md"
                    } ${isActive ? "opacity-80" : ""}`}
                    style={{
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      width: `${f.width}%`,
                      height: `${f.height}%`,
                      zIndex: isSelected ? 20 : 10,
                      borderColor: color.hex,
                      backgroundColor: color.light,
                      opacity: isActive ? 0.8 : 0.85,
                      outline: isSelected ? `2px solid ${color.hex}` : "none",
                      outlineOffset: 1,
                    }}
                  >
                    {/* Type icon + label */}
                    <div className="flex items-center gap-1 select-none pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth="1.5" className="w-3 h-3 flex-shrink-0">
                        <path d={getFieldTypeIcon(f.field_type)} />
                      </svg>
                      <span className="text-[10px] font-semibold truncate" style={{ color: color.accent }}>
                        {FIELD_LABEL_MAP[f.field_type]}
                      </span>
                    </div>
                    {/* Signer name */}
                    <span className="text-[9px] truncate select-none pointer-events-none" style={{ color: color.hex }}>
                      {signer?.name || signer?.email?.split("@")[0]}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={e => { e.stopPropagation(); removeField(f.id); }}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-all shadow-sm"
                      style={{ opacity: isSelected ? 1 : 0 }}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      &times;
                    </button>

                    {/* Resize handles (only show when selected) */}
                    {isSelected && (
                      <>
                        {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map(handle => (
                          <div
                            key={handle}
                            onMouseDown={e => handleResizeMouseDown(f.id, handle, e)}
                            className="absolute w-2.5 h-2.5 bg-white border-2 rounded-sm shadow-sm z-20"
                            style={{
                              borderColor: color.hex,
                              cursor: handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize",
                              ...(handle.includes("n") ? { top: -5 } : { bottom: -5 }),
                              ...(handle.includes("w") ? { left: -5 } : { right: -5 }),
                            }}
                          />
                        ))}
                        {(["n", "s", "e", "w"] as ResizeHandle[]).map(handle => (
                          <div
                            key={handle}
                            onMouseDown={e => handleResizeMouseDown(f.id, handle, e)}
                            className="absolute bg-white border-2 rounded-sm shadow-sm z-20"
                            style={{
                              borderColor: color.hex,
                              cursor: handle === "n" || handle === "s" ? "ns-resize" : "ew-resize",
                              ...(handle === "n" ? { top: -4, left: "50%", transform: "translateX(-50%)", width: 10, height: 5 } : {}),
                              ...(handle === "s" ? { bottom: -4, left: "50%", transform: "translateX(-50%)", width: 10, height: 5 } : {}),
                              ...(handle === "e" ? { right: -4, top: "50%", transform: "translateY(-50%)", width: 5, height: 10 } : {}),
                              ...(handle === "w" ? { left: -4, top: "50%", transform: "translateY(-50%)", width: 5, height: 10 } : {}),
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Empty state overlay */}
              {pageFields.length === 0 && selectedSigner && !draggingFieldType && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-5 rounded-xl px-8 py-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gray-400 mx-auto mb-2">
                      <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">左のパレットからドラッグ&ドロップ</p>
                    <p className="text-xs text-gray-400 mt-1">またはクリックで署名欄を配置</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Properties panel */}
        <div className="w-56 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
          {selectedField ? (() => {
            const color = getSignerColor(selectedField.signer_id);
            const signer = signers.find(s => s.id === selectedField.signer_id);
            return (
              <>
                {/* Field properties header */}
                <div className="px-4 py-3 border-b border-gray-100" style={{ backgroundColor: color.light }}>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth="1.5" className="w-4 h-4">
                      <path d={getFieldTypeIcon(selectedField.field_type)} />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: color.accent }}>
                      {FIELD_LABEL_MAP[selectedField.field_type]}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Field Type */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">フィールドタイプ</label>
                    <select
                      value={selectedField.field_type}
                      onChange={e => updateFieldType(selectedFieldId!, e.target.value as FieldType)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {FIELD_TYPES.map(ft => (
                        <option key={ft.type} value={ft.type}>{ft.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Signer */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">署名者</label>
                    <select
                      value={selectedField.signer_id}
                      onChange={e => updateFieldSigner(selectedFieldId!, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {signers.map((s, i) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.email} {s.company_name ? `(${s.company_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Required badge */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500">必須フィールド</label>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">必須</span>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Position & Size */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">位置 & サイズ</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">X</span>
                        <div className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                          {selectedField.x.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">Y</span>
                        <div className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                          {selectedField.y.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">幅</span>
                        <div className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                          {selectedField.width.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">高さ</span>
                        <div className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                          {selectedField.height.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">ページ: {selectedField.page}</p>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Delete button */}
                  <button
                    onClick={() => removeField(selectedFieldId!)}
                    className="w-full rounded-lg border border-red-200 text-red-600 hover:bg-red-50 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    フィールドを削除
                  </button>
                </div>
              </>
            );
          })() : (
            /* No field selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">フィールドを選択</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                配置済みフィールドをクリックするとプロパティを編集できます
              </p>
            </div>
          )}

          {/* Field list at bottom */}
          <div className="border-t border-gray-200 max-h-52 overflow-y-auto">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0">
              <span className="text-xs font-semibold text-gray-500">配置フィールド一覧</span>
              <span className="text-xs text-gray-400">{fields.length}件</span>
            </div>
            <div className="p-1.5 space-y-0.5">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">フィールドなし</p>
              ) : (
                fields.map(f => {
                  const signer = signers.find(s => s.id === f.signer_id);
                  const color = getSignerColor(f.signer_id);
                  const isSelected = selectedFieldId === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => { setSelectedFieldId(f.id); setCurrentPage(f.page); }}
                      className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "ring-1" : "hover:bg-gray-50"
                      }`}
                      style={isSelected ? { backgroundColor: color.light, ringColor: color.hex } : {}}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color.hex }} />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-400 flex-shrink-0">
                          <path d={getFieldTypeIcon(f.field_type)} />
                        </svg>
                        <span className="text-gray-600 truncate">{FIELD_LABEL_MAP[f.field_type]}</span>
                        <span className="text-gray-400 flex-shrink-0">P{f.page}</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeField(f.id); }}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
