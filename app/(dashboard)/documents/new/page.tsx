"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TemplateSelector } from "@/components/TemplateSelector";
import { SignerInput, type SignerRow } from "@/components/SignerInput";
import type { TemplateWithFolder, EmailTemplate } from "@/lib/types";

function NewDocumentForm() {
  const [title, setTitle] = useState("");
  const [signers, setSigners] = useState<SignerRow[]>([{ company_name: "", name: "", email: "" }]);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithFolder | null>(null);
  const router = useRouter();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !selectedTemplate) {
      setError("PDFファイルまたはテンプレートを選択してください。");
      return;
    }
    if (file && file.type !== "application/pdf") {
      setError("PDFファイルのみアップロードできます。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title || (file?.name ?? selectedTemplate?.name ?? ""));
      formData.set("signers", JSON.stringify(signers.filter((s) => s.email.trim())));
      formData.set("email_message", emailMessage);
      if (selectedTemplate) {
        formData.set("template_id", selectedTemplate.id);
      }
      if (file) {
        formData.set("file", file);
      }
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      const { id } = await res.json();
      router.push(`/documents/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-gray-800">署名を依頼する</span>
      </div>

      <h1 className="text-xl font-bold text-gray-800 mb-6">署名を依頼する</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Source selection: Template or File */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">文書の選択</h2>
          </div>
          <div className="p-5">
            {/* Template selection button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowTemplateSelector(true)}
                className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  selectedTemplate
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {selectedTemplate ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-blue-600">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{selectedTemplate.name}</div>
                      <div className="text-xs text-gray-500">テンプレートから選択済み</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedTemplate(null); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">テンプレートから選択</div>
                      <div className="text-xs text-gray-400">登録済みの契約書テンプレートを使用</div>
                    </div>
                  </div>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">または</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* File drop area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300"
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-green-500">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">{file.name}</div>
                    <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="ml-4 text-gray-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-gray-300">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">ここにPDFをドロップ</p>
                  <label className="mt-2 cursor-pointer rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document info */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">文書情報</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">タイトル</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="契約書のタイトル"
              />
            </div>
          </div>
        </div>

        {/* Signers */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">署名者</h2>
          </div>
          <div className="p-5">
            <SignerInput signers={signers} onChange={setSigners} />
          </div>
        </div>

        {/* Email message */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">メール本文</h2>
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={"署名をお願いいたします。\n\n以下のリンクからアクセスしてください。"}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              <Link href="/settings/email-templates" className="text-blue-500 hover:underline">メールテンプレート管理</Link>
              で定型文を登録できます
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || (!file && !selectedTemplate)}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "作成中..." : "文書を作成"}
          </button>
          <Link
            href="/documents"
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            キャンセル
          </Link>
        </div>
      </form>

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
      <NewDocumentForm />
    </Suspense>
  );
}
