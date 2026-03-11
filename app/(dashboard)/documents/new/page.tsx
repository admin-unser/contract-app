"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewDocumentPage() {
  const [title, setTitle] = useState("");
  const [emails, setEmails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("PDFファイルを選択してください。");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("PDFファイルのみアップロードできます。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title || file.name);
      formData.set("emails", emails);
      formData.set("file", file);
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/documents" className="text-sm text-blue-600 hover:underline">
          ← 文書一覧へ
        </Link>
      </div>
      <h1 className="text-xl font-semibold">新規アップロード</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
            タイトル（任意）
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="契約書.pdf"
          />
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-zinc-700 mb-1">
            PDF ファイル *
          </label>
          <input
            id="file"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700"
          />
        </div>
        <div>
          <label htmlFor="emails" className="block text-sm font-medium text-zinc-700 mb-1">
            署名者メールアドレス（複数可・1行1件）
          </label>
          <textarea
            id="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="signer1@example.com&#10;signer2@example.com"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "アップロード中..." : "アップロードして送信"}
          </button>
          <Link
            href="/documents"
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
