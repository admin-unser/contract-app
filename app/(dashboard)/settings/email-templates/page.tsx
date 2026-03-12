"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EmailTemplate } from "@/lib/types";

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", body_html: "", is_default: false });
  const [saving, setSaving] = useState(false);

  async function loadTemplates() {
    setLoading(true);
    const res = await fetch("/api/email-templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadTemplates(); }, []);

  async function handleSave() {
    if (!form.name || !form.subject || !form.body_html) return;
    setSaving(true);
    const res = await fetch("/api/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", subject: "", body_html: "", is_default: false });
      setShowForm(false);
      loadTemplates();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("このメールテンプレートを削除しますか？")) return;
    await fetch("/api/email-templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadTemplates();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-gray-800">メールテンプレート</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">メールテンプレート</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新規作成
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">新規メールテンプレート</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">テンプレート名</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: 署名依頼（標準）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">件名</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: 【署名依頼】{{document_title}}"
              />
              <p className="text-xs text-gray-400 mt-1">{"{{document_title}}, {{signer_name}}, {{sender_name}} が使えます"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">本文</label>
              <textarea
                value={form.body_html}
                onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={"{{signer_name}} 様\n\n以下の文書への署名をお願いいたします。\n\n文書: {{document_title}}\n\n署名リンクからアクセスしてください。"}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              デフォルトとして設定
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.subject || !form.body_html}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">メールテンプレートがありません</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 hover:underline">
            最初のテンプレートを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                  {t.is_default && (
                    <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">デフォルト</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">件名: {t.subject}</div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
