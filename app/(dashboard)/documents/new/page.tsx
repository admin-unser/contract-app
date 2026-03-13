"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Stepper } from "@/components/Stepper";
import { TemplateSelector } from "@/components/TemplateSelector";
import type { SignerRow } from "@/components/SignerInput";
import type { TemplateWithFolder, EmailTemplate, EnvelopeSigner, SignatureField, FieldType, DocumentCategory } from "@/lib/types";
import { FIELD_TYPE_CONFIG, DOCUMENT_CATEGORIES } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const STEPS = [
  { label: "文書情報登録" },
  { label: "送信先情報登録" },
  { label: "入力位置の設定" },
  { label: "確認" },
];

const SIGNER_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", hex: "#3b82f6", ring: "ring-blue-400" },
  { bg: "bg-green-100", border: "border-green-400", text: "text-green-700", hex: "#22c55e", ring: "ring-green-400" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", hex: "#a855f7", ring: "ring-purple-400" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", hex: "#f97316", ring: "ring-orange-400" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700", hex: "#ec4899", ring: "ring-pink-400" },
];

// ── Field placement types ──
interface FieldDraft {
  id: string;
  signer_id: string;
  field_type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

type InteractionMode = "idle" | "dragging" | "resizing";
type ResizeHandle = "se" | "sw" | "ne" | "nw" | "e" | "w" | "s" | "n";

const MIN_FIELD_WIDTH = 3;
const MIN_FIELD_HEIGHT = 2;

const FIELD_TYPE_ORDER: FieldType[] = ["signature", "name", "company", "address", "date", "stamp", "text", "checkbox"];

function NewDocumentWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithFolder | null>(null);
  const [pdfPreviewPage, setPdfPreviewPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const [pdfPreviewWidth, setPdfPreviewWidth] = useState(500);

  // Step 2 state
  const [signers, setSigners] = useState<SignerRow[]>([{ company_name: "", name: "", email: "" }]);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  // Step 3 state (after document creation)
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [createdSigners, setCreatedSigners] = useState<EnvelopeSigner[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [fieldCurrentPage, setFieldCurrentPage] = useState(1);
  const [fieldTotalPages, setFieldTotalPages] = useState(1);
  const [selectedSigner, setSelectedSigner] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>("signature");
  const fieldContainerRef = useRef<HTMLDivElement>(null);
  const [fieldPdfWidth, setFieldPdfWidth] = useState(600);
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const interactionStart = useRef<{ mouseX: number; mouseY: number; field: FieldDraft } | null>(null);

  // General
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load email templates
  useEffect(() => {
    fetch("/api/email-templates")
      .then((r) => r.json())
      .then((data: EmailTemplate[]) => {
        setEmailTemplates(data);
        const defaultTpl = data.find((t) => t.is_default);
        if (defaultTpl) setEmailMessage(defaultTpl.body_html);
      })
      .catch(() => {});
  }, []);

  // Measure PDF preview width
  useEffect(() => {
    function updateWidth() {
      if (pdfPreviewRef.current) setPdfPreviewWidth(pdfPreviewRef.current.clientWidth);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [currentStep]);

  // Measure field container width
  useEffect(() => {
    function updateWidth() {
      if (fieldContainerRef.current) setFieldPdfWidth(fieldContainerRef.current.clientWidth);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [currentStep, documentId]);

  // Generate file URL for preview
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  // ── Step 1: File handling ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== "application/pdf") {
        setError("PDFファイルのみアップロードできます。");
        return;
      }
      setFile(droppedFile);
      setSelectedTemplate(null);
      if (!title) setTitle(droppedFile.name.replace(/\.pdf$/i, ""));
      setError(null);
    }
  }, [title]);

  function handleTemplateSelect(template: TemplateWithFolder) {
    setSelectedTemplate(template);
    setFile(null);
    if (!title) setTitle(template.name);
    setShowTemplateSelector(false);
  }

  // ── Step 2 → Step 3 transition: Create document ──
  async function createDocument() {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("title", title || (file?.name ?? selectedTemplate?.name ?? ""));
      formData.set("category", category || "");
      formData.set("signers", JSON.stringify(signers.filter((s) => s.email.trim())));
      formData.set("email_message", emailMessage);
      if (selectedTemplate) formData.set("template_id", selectedTemplate.id);
      if (file) formData.set("file", file);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      const { id } = await res.json();
      setDocumentId(id);

      // Load document data for step 3
      const [pdfRes, signersRes, fieldsRes] = await Promise.all([
        fetch(`/api/documents/${id}/pdf-url`),
        fetch(`/api/documents/${id}/signers`),
        fetch(`/api/documents/${id}/fields`),
      ]);

      if (pdfRes.ok) {
        const { url } = await pdfRes.json();
        setPdfUrl(url);
      }
      if (signersRes.ok) {
        const data = await signersRes.json();
        setCreatedSigners(data);
        if (data.length > 0) setSelectedSigner(data[0].id);
      }
      if (fieldsRes.ok) {
        const data: SignatureField[] = await fieldsRes.json();
        setFields(data.map((f) => ({ ...f, id: f.id, field_type: f.field_type || "signature" })));
      }

      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文書の作成に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Field placement logic (Drag & Drop only) ──
  function handlePdfDrop(e: React.DragEvent) {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType") as FieldType;
    if (!fieldType || !selectedSigner) return;
    const container = fieldContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const config = FIELD_TYPE_CONFIG[fieldType];
    const fw = config.defaultWidth;
    const fh = config.defaultHeight;
    const x = Math.max(0, Math.min(100 - fw, xPct - fw / 2));
    const y = Math.max(0, Math.min(100 - fh, yPct - fh / 2));
    const newField: FieldDraft = {
      id: crypto.randomUUID(),
      signer_id: selectedSigner,
      field_type: fieldType,
      page: fieldCurrentPage,
      x, y,
      width: fw,
      height: fh,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setDragOverPdf(false);
  }

  const [dragOverPdf, setDragOverPdf] = useState(false);

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }

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
    const container = fieldContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = ((e.clientX - interactionStart.current.mouseX) / rect.width) * 100;
    const dy = ((e.clientY - interactionStart.current.mouseY) / rect.height) * 100;
    const orig = interactionStart.current.field;

    if (mode === "dragging") {
      setFields((prev) => prev.map((f) => f.id === activeFieldId ? {
        ...f,
        x: Math.max(0, Math.min(100 - orig.width, orig.x + dx)),
        y: Math.max(0, Math.min(100 - orig.height, orig.y + dy)),
      } : f));
    } else if (mode === "resizing" && resizeHandle) {
      let { x, y, width, height } = orig;
      if (resizeHandle.includes("e")) { width = Math.max(MIN_FIELD_WIDTH, orig.width + dx); if (x + width > 100) width = 100 - x; }
      if (resizeHandle.includes("w")) { const nw = Math.max(MIN_FIELD_WIDTH, orig.width - dx); const nx = orig.x + orig.width - nw; if (nx >= 0) { x = nx; width = nw; } }
      if (resizeHandle.includes("s")) { height = Math.max(MIN_FIELD_HEIGHT, orig.height + dy); if (y + height > 100) height = 100 - y; }
      if (resizeHandle.includes("n")) { const nh = Math.max(MIN_FIELD_HEIGHT, orig.height - dy); const ny = orig.y + orig.height - nh; if (ny >= 0) { y = ny; height = nh; } }
      setFields((prev) => prev.map((f) => f.id === activeFieldId ? { ...f, x, y, width, height } : f));
    }
  }, [mode, activeFieldId, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setMode("idle");
    setActiveFieldId(null);
    setResizeHandle(null);
    interactionStart.current = null;
  }, []);

  // ── Step 3 → Step 4: Save fields ──
  async function saveFieldsAndProceed() {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map((f) => ({
            signer_id: f.signer_id,
            field_type: f.field_type,
            page: f.page,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
          })),
        }),
      });
      if (!res.ok) throw new Error("フィールドの保存に失敗しました。");
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 4: Send ──
  async function handleSend() {
    if (!documentId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "送信に失敗しました。");
      }
      router.push(`/documents/${documentId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setSending(false);
    }
  }

  // ── Navigation helpers ──
  function canGoNext(): boolean {
    if (currentStep === 0) return !!(file || selectedTemplate);
    if (currentStep === 1) return signers.some((s) => s.email.trim());
    if (currentStep === 2) return fields.length > 0;
    return true;
  }

  function handleNext() {
    setError(null);
    if (currentStep === 0) {
      if (!file && !selectedTemplate) {
        setError("PDFファイルまたはテンプレートを選択してください。");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!signers.some((s) => s.email.trim())) {
        setError("少なくとも1人の署名者を追加してください。");
        return;
      }
      createDocument();
    } else if (currentStep === 2) {
      saveFieldsAndProceed();
    }
  }

  function handleBack() {
    setError(null);
    if (currentStep === 1) setCurrentStep(0);
    // Step 3/4: Cannot go back (document already created)
  }

  function getSignerColor(signerId: string) {
    const idx = createdSigners.findIndex((s) => s.id === signerId);
    return SIGNER_COLORS[idx % SIGNER_COLORS.length];
  }

  // Keyboard shortcuts for field placement
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (currentStep !== 2) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFieldId && !(e.target instanceof HTMLInputElement)) {
        removeField(selectedFieldId);
      }
      if (e.key === "Escape") setSelectedFieldId(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFieldId, currentStep]);

  const pageFields = fields.filter((f) => f.page === fieldCurrentPage);

  // ── Signer update helpers for step 2 ──
  function updateSigner(index: number, field: keyof SignerRow, value: string) {
    const updated = [...signers];
    updated[index] = { ...updated[index], [field]: value };
    setSigners(updated);
  }
  function addSigner() {
    setSigners([...signers, { company_name: "", name: "", email: "" }]);
  }
  function removeSigner(index: number) {
    if (signers.length <= 1) return;
    setSigners(signers.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">署名を依頼する</span>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* ═══════ STEP 1: 文書情報登録 ═══════ */}
      {currentStep === 0 && (
        <div className="flex gap-6">
          {/* Left: PDF preview */}
          <div className="flex-1 min-w-0">
            <div
              ref={pdfPreviewRef}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              style={{ minHeight: 500 }}
            >
              {(fileUrl || selectedTemplate) ? (
                <>
                  {fileUrl && (
                    <Document
                      file={fileUrl}
                      onLoadSuccess={({ numPages }) => setPdfTotalPages(numPages)}
                      loading={<div className="flex items-center justify-center h-[500px] text-gray-400">PDF読み込み中...</div>}
                      error={<div className="flex items-center justify-center h-[500px] text-red-400">PDFの読み込みに失敗しました</div>}
                    >
                      <Page pageNumber={pdfPreviewPage} width={pdfPreviewWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                  )}
                  {selectedTemplate && !fileUrl && (
                    <div className="flex items-center justify-center h-[500px] text-gray-400">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 text-blue-300 mx-auto mb-3">
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                        </svg>
                        <p className="font-medium text-gray-600">{selectedTemplate.name}</p>
                        <p className="text-sm text-gray-400 mt-1">テンプレートから選択済み</p>
                      </div>
                    </div>
                  )}
                  {/* Page navigation for file preview */}
                  {fileUrl && pdfTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 py-2 border-t border-gray-100">
                      <button onClick={() => setPdfPreviewPage(Math.max(1, pdfPreviewPage - 1))} disabled={pdfPreviewPage <= 1} className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-30">&larr; 前</button>
                      <span className="text-xs text-gray-500">{pdfPreviewPage} / {pdfTotalPages}</span>
                      <button onClick={() => setPdfPreviewPage(Math.min(pdfTotalPages, pdfPreviewPage + 1))} disabled={pdfPreviewPage >= pdfTotalPages} className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-30">次 &rarr;</button>
                    </div>
                  )}
                </>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`flex items-center justify-center h-[500px] transition-colors ${
                    isDragging ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-20 h-20 text-gray-300 mx-auto mb-4">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                      <line x1="12" y1="11" x2="12" y2="17" />
                      <polyline points="9 14 12 11 15 14" />
                    </svg>
                    <p className="text-gray-500 mb-3">PDFファイルをドロップ</p>
                    <label className="cursor-pointer rounded-lg bg-blue-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
                      ファイルを選択
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setFile(f);
                            setSelectedTemplate(null);
                            if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400">または</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(true)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      テンプレートから選択
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Document info */}
          <div className="w-96 flex-shrink-0 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-800">登録する文書</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">文書名</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="契約書のタイトル"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">カテゴリー</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory | "")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">未分類</option>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* File info */}
                {(file || selectedTemplate) && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-blue-500 flex-shrink-0">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {file ? file.name : selectedTemplate?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {file ? `${(file.size / 1024).toFixed(0)} KB` : "テンプレート"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setSelectedTemplate(null);
                        setTitle("");
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Change file button */}
                {(file || selectedTemplate) && (
                  <div className="flex gap-2">
                    <label className="flex-1 text-center cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      ファイルを変更
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setFile(f);
                            setSelectedTemplate(null);
                            if (!title || title === selectedTemplate?.name) setTitle(f.name.replace(/\.pdf$/i, ""));
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(true)}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      テンプレート
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP 2: 送信先情報登録 ═══════ */}
      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Envelope name */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">封筒名</h2>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={file?.name ?? selectedTemplate?.name ?? "文書タイトル"}
              />
            </div>
          </div>

          {/* Signers */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">送信先の登録</h2>
              <p className="text-sm text-gray-500 mt-0.5">署名者の情報を設定します。</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Signer list */}
              {signers.map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">署名者 {i + 1}</span>
                    </div>
                    {signers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSigner(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">会社名</label>
                      <input
                        value={s.company_name}
                        onChange={(e) => updateSigner(i, "company_name", e.target.value)}
                        placeholder="株式会社〇〇"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">氏名</label>
                      <input
                        value={s.name}
                        onChange={(e) => updateSigner(i, "name", e.target.value)}
                        placeholder="山田 太郎"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={s.email}
                        onChange={(e) => updateSigner(i, "email", e.target.value)}
                        placeholder="example@company.com"
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add signer button */}
              <button
                type="button"
                onClick={addSigner}
                className="w-full rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 py-4 text-blue-600 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                署名者を追加する
              </button>
            </div>
          </div>

          {/* Email message */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">メール本文</h2>
                <p className="text-sm text-gray-500 mt-0.5">署名依頼メールに添付するメッセージ</p>
              </div>
              {emailTemplates.length > 0 && (
                <select
                  onChange={(e) => {
                    const tpl = emailTemplates.find((t) => t.id === e.target.value);
                    if (tpl) setEmailMessage(tpl.body_html);
                  }}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>テンプレートを選択</option>
                  {emailTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="p-5">
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={"署名をお願いいたします。\n\n以下のリンクからアクセスしてください。"}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP 3: 入力位置の設定 ═══════ */}
      {currentStep === 2 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
            <div className="flex items-center justify-between h-14">
              {/* Left: Signer tabs */}
              <div className="flex items-center gap-1">
                {createdSigners.map((s, i) => {
                  const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
                  const fieldCount = fields.filter((f) => f.signer_id === s.id).length;
                  const isActive = selectedSigner === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSigner(s.id)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white shadow-sm border border-gray-200"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      >
                        {(s.name || s.email)[0].toUpperCase()}
                      </div>
                      <span className={`hidden sm:inline truncate max-w-[100px] ${isActive ? "text-gray-800" : ""}`}>
                        {s.name || s.email.split("@")[0]}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? `${color.bg} ${color.text}` : "bg-gray-100 text-gray-400"
                      }`}>{fieldCount}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ backgroundColor: color.hex }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Center: Page navigation */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                <button
                  onClick={() => setFieldCurrentPage(Math.max(1, fieldCurrentPage - 1))}
                  disabled={fieldCurrentPage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none text-gray-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="text-xs font-semibold text-gray-700 min-w-[60px] text-center">
                  {fieldCurrentPage} / {fieldTotalPages} ページ
                </span>
                <button
                  onClick={() => setFieldCurrentPage(Math.min(fieldTotalPages, fieldCurrentPage + 1))}
                  disabled={fieldCurrentPage >= fieldTotalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none text-gray-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>

              {/* Right: Field count summary */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                  <span className="font-medium">{fields.length}</span> 項目配置済み
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex" style={{ height: "calc(100vh - 220px)" }}>
            {/* Left: Field palette sidebar */}
            <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
              {/* Field types section */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3 h-3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">入力フィールド</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">ドラッグ&ドロップで文書上に配置してください</p>

                <div className="space-y-1.5">
                  {FIELD_TYPE_ORDER.map((ft) => {
                    const config = FIELD_TYPE_CONFIG[ft];
                    const canDrag = !!selectedSigner;
                    const isSelected = selectedFieldType === ft;
                    const count = fields.filter((f) => f.field_type === ft).length;
                    return (
                      <div
                        key={ft}
                        draggable={canDrag}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("fieldType", ft);
                          e.dataTransfer.effectAllowed = "copy";
                          setSelectedFieldType(ft);
                        }}
                        onClick={() => setSelectedFieldType(ft)}
                        className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                          !canDrag ? "opacity-40 cursor-not-allowed" :
                          isSelected
                            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm cursor-grab active:cursor-grabbing"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200"
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                          isSelected ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"
                        }`}>
                          {config.icon}
                        </span>
                        <span className="flex-1">{config.label}</span>
                        {count > 0 && (
                          <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-500"
                          }`}>{count}</span>
                        )}
                        {canDrag && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-opacity ${isSelected ? "opacity-50" : "opacity-0 group-hover:opacity-30"}`}>
                            <circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" />
                            <circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" />
                            <circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-gray-100" />

              {/* Placed fields section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" className="w-3 h-3"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">配置済み</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{fields.length}</span>
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {fields.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="w-6 h-6">
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                          <line x1="9" y1="13" x2="15" y2="13" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400">まだフィールドが<br/>配置されていません</p>
                    </div>
                  ) : (
                    fields.map((f) => {
                      const color = getSignerColor(f.signer_id);
                      const ftConfig = FIELD_TYPE_CONFIG[f.field_type];
                      const signerIdx = createdSigners.findIndex((s) => s.id === f.signer_id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => { setSelectedFieldId(f.id); setFieldCurrentPage(f.page); }}
                          className={`group flex items-center gap-2.5 text-xs py-2.5 px-3 rounded-lg cursor-pointer transition-all ${
                            selectedFieldId === f.id
                              ? `${color.bg} border ${color.border} shadow-sm`
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0" style={{ backgroundColor: color.hex }}>
                            {signerIdx + 1}
                          </div>
                          <span className="text-sm">{ftConfig?.icon}</span>
                          <span className="text-gray-700 font-medium flex-1 truncate">{ftConfig?.label}</span>
                          <span className="text-[10px] text-gray-400 font-mono">P{f.page}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                            className="w-5 h-5 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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

            {/* Center: PDF Canvas */}
            <div className="flex-1 min-w-0 bg-gray-100 overflow-auto flex justify-center py-6 px-4">
              <div className="relative" style={{ width: "fit-content" }}>
                {/* Shadow wrapper for the PDF */}
                <div
                  ref={fieldContainerRef}
                  className={`relative bg-white shadow-2xl select-none transition-all ${
                    dragOverPdf ? "ring-4 ring-blue-400/50 ring-offset-4 ring-offset-gray-100" : ""
                  }`}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDragOver={(e) => { e.preventDefault(); setDragOverPdf(true); }}
                  onDragLeave={() => setDragOverPdf(false)}
                  onDrop={handlePdfDrop}
                >
                  {pdfUrl && (
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={({ numPages }) => setFieldTotalPages(numPages)}
                      loading={<div className="flex items-center justify-center h-[700px] w-[500px] text-gray-400"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}
                      error={<div className="flex items-center justify-center h-[700px] w-[500px] text-red-400">PDFの読み込みに失敗しました</div>}
                    >
                      <Page pageNumber={fieldCurrentPage} width={fieldPdfWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                  )}

                  {/* Field overlays */}
                  {pageFields.map((f) => {
                    const color = getSignerColor(f.signer_id);
                    const isSelected = selectedFieldId === f.id;
                    const signerIdx = createdSigners.findIndex((s) => s.id === f.signer_id);
                    return (
                      <div
                        key={f.id}
                        data-field-id={f.id}
                        onMouseDown={(e) => handleFieldMouseDown(f.id, e)}
                        className={`absolute rounded-md cursor-move flex items-center justify-center transition-all ${
                          isSelected
                            ? "shadow-lg ring-2 ring-offset-1"
                            : "hover:shadow-md hover:brightness-95"
                        }`}
                        style={{
                          left: `${f.x}%`, top: `${f.y}%`,
                          width: `${f.width}%`, height: `${f.height}%`,
                          zIndex: isSelected ? 20 : 10,
                          backgroundColor: `${color.hex}18`,
                          border: `2px solid ${color.hex}`,
                          boxShadow: isSelected ? `0 0 0 2px ${color.hex}40` : undefined,
                          ringColor: isSelected ? color.hex : undefined,
                        }}
                      >
                        {/* Signer badge */}
                        <div
                          className="absolute -top-2 -left-2 w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold shadow-md z-30"
                          style={{ backgroundColor: color.hex }}
                        >
                          {signerIdx + 1}
                        </div>

                        <span className="text-[10px] font-semibold select-none pointer-events-none flex items-center gap-1" style={{ color: color.hex }}>
                          <span className="text-xs">{FIELD_TYPE_CONFIG[f.field_type]?.icon}</span>
                          <span>{FIELD_TYPE_CONFIG[f.field_type]?.label}</span>
                        </span>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                          className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow-lg transition-all"
                          style={{ opacity: isSelected ? 1 : 0 }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>

                        {/* Resize handles */}
                        {isSelected && (
                          <>
                            {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
                              <div
                                key={handle}
                                onMouseDown={(e) => handleResizeMouseDown(f.id, handle, e)}
                                className="absolute w-3 h-3 bg-white rounded-full shadow-md z-20 border-2"
                                style={{
                                  borderColor: color.hex,
                                  cursor: handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize",
                                  ...(handle.includes("n") ? { top: -6 } : { bottom: -6 }),
                                  ...(handle.includes("w") ? { left: -6 } : { right: -6 }),
                                }}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state hint */}
                  {pageFields.length === 0 && selectedSigner && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" className="w-8 h-8">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-600">フィールドをドラッグ&ドロップ</p>
                          <p className="text-xs text-gray-400 mt-1">左パネルから項目をドラッグして配置</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drag over overlay */}
                  {dragOverPdf && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-blue-500/5">
                      <div className="flex flex-col items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-10 py-8 shadow-xl border border-blue-200">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center animate-bounce">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" className="w-6 h-6">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-blue-600">ここにドロップして配置</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP 4: 確認 ═══════ */}
      {currentStep === 3 && (
        <div className="max-w-4xl mx-auto">
          {/* DocuSign-style header banner */}
          <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">署名依頼の送信確認</h2>
                <p className="text-blue-100 text-sm mt-1">内容を確認して「署名依頼を送信」ボタンを押してください</p>
              </div>
            </div>
          </div>

          <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Left: Document preview */}
              <div className="lg:col-span-2 border-r border-gray-100 bg-gray-50 p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">文書プレビュー</h3>
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {pdfUrl && (
                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                      <Document file={pdfUrl} loading={<div className="text-gray-400 text-sm">読み込み中...</div>}>
                        <Page pageNumber={1} width={240} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                    </div>
                  )}
                  {!pdfUrl && fileUrl && (
                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                      <Document file={fileUrl} loading={<div className="text-gray-400 text-sm">読み込み中...</div>}>
                        <Page pageNumber={1} width={240} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{title || "無題"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{file?.name ?? selectedTemplate?.name ?? ""}</p>
                  </div>
                </div>
                {category && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                    {DOCUMENT_CATEGORIES.find(c => c.value === category)?.label ?? category}
                  </div>
                )}
              </div>

              {/* Right: Summary details */}
              <div className="lg:col-span-3 p-6 space-y-6">
                {/* Signers list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      送信先
                    </h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5">{createdSigners.length}名</span>
                  </div>
                  <div className="space-y-2">
                    {createdSigners.map((s, i) => {
                      const color = SIGNER_COLORS[i % SIGNER_COLORS.length];
                      const signerFields = fields.filter((f) => f.signer_id === s.id);
                      return (
                        <div key={s.id} className="rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ backgroundColor: color.hex }}>
                              {(s.name || s.email)[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 truncate">{s.name || s.email.split("@")[0]}</span>
                                {s.company_name && (
                                  <span className="text-xs text-gray-400 truncate">- {s.company_name}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{s.email}</div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              {signerFields.length}項目
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fields summary */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                    入力項目
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_TYPE_ORDER.filter((ft) => fields.some((f) => f.field_type === ft)).map((ft) => {
                      const count = fields.filter((f) => f.field_type === ft).length;
                      const config = FIELD_TYPE_CONFIG[ft];
                      return (
                        <div key={ft} className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm">
                          <span className="text-gray-600">{config.icon} {config.label}</span>
                          <span className="text-gray-800 font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Email message preview */}
                {emailMessage && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue-500"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      メールメッセージ
                    </h3>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {emailMessage.substring(0, 200)}{emailMessage.length > 200 ? "..." : ""}
                    </div>
                  </div>
                )}

                {/* Send action area */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-blue-600"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">送信準備完了</p>
                      <p className="text-xs text-gray-500 mt-1">{createdSigners.length}名の署名者に署名依頼メールが送信されます。各署名者にはメール内のリンクから署名できます。</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending}
                    className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        送信中...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        署名依頼を送信する
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Bottom navigation ═══════ */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
        <div>
          {currentStep > 0 && currentStep < 2 && (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              &larr; 戻る
            </button>
          )}
          {currentStep >= 2 && (
            <Link
              href="/documents"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              下書きに保存して終了
            </Link>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < 3 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext() || loading}
              className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  処理中...
                </>
              ) : (
                <>次へ &rarr;</>
              )}
            </button>
          )}
          {/* Step 4 send button is inside the confirmation panel above */}
        </div>
      </div>

      {/* Template selector modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">読み込み中...</div>}>
      <NewDocumentWizard />
    </Suspense>
  );
}
