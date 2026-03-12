"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TemplateFolder } from "@/lib/types";

export default function NewTemplatePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/templates/folders")
      .then((r) => r.json())
      .then(setFolders)
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
      if (!name) setName(droppedFile.name.replace(/\.pdf$/i, ""));
      setError(null);
    }
  }, [name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("PDFファイルを選択してください。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", name || file.name.replace(/\.pdf$/i, ""));
      formData.set("description", description);
      if (folderId) formData.set("folder_id", folderId);
      formData.set("file", file);
      const res = await fetch("/api/templates", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      router.push("/templates");
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
        <Link href="/templates" className="hover:text-blue-600 transition-colors">テンプレート</Link>
        <span>/</span>
        <span className="text-gray-800">新規作成</span>
      </div>

      <h1 className="text-xl font-bold text-gray-800 mb-6">テンプレート登録</h1>

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

        {/* File upload */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">PDFファイル</h2>
          </div>
          <div className="p-5">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? "border-blue-400 bg-blue-50" : file ? "border-green-300 bg-green-50" : "border-gray-300"
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
                  <label className="mt-2 cursor-pointer rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    ファイルを選択
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) { setFile(f); if (!name) setName(f.name.replace(/\.pdf$/i, "")); }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template info */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">テンプレート情報</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">テンプレート名</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: 業務委託契約書"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">説明（任意）</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="テンプレートの説明"
              />
            </div>
            <div>
              <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-1.5">フォルダ（任意）</label>
              <select
                id="folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">未分類</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "登録中..." : "テンプレートを登録"}
          </button>
          <Link href="/templates" className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
