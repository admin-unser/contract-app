"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", type: "general", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[MUSUBI sign] ${formData.type === "enterprise" ? "Enterprise お問い合わせ" : formData.type === "bug" ? "不具合報告" : "お問い合わせ"}`);
    const body = encodeURIComponent(
      `お名前: ${formData.name}\nメール: ${formData.email}\n企業名: ${formData.company || "未記入"}\n種別: ${formData.type}\n\n${formData.message}`
    );
    window.location.href = `mailto:support@unser-inc.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a365d] to-[#312e81] flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gray-800">MUSUBI sign</span>
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">お問い合わせ</h1>
        <p className="text-sm text-gray-500 mb-10">ご質問・ご要望・不具合のご報告はこちらからお気軽にどうぞ。</p>

        {submitted ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="w-6 h-6"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">メールクライアントが起動します</h2>
            <p className="text-sm text-gray-600">メールアプリからお問い合わせ内容を送信してください。</p>
            <Link href="/" className="inline-block mt-6 text-sm text-indigo-600 hover:underline">トップページに戻る</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">お名前 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">企業名</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="株式会社〇〇"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">お問い合わせ種別</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="general">一般的なご質問</option>
                <option value="enterprise">Enterpriseプランのご相談</option>
                <option value="feature">機能リクエスト</option>
                <option value="bug">不具合のご報告</option>
                <option value="security">セキュリティに関するご報告</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">お問い合わせ内容 *</label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                placeholder="お問い合わせ内容を入力してください..."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-[#1a365d] to-[#312e81] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all"
            >
              メールで送信する
            </button>
            <p className="text-xs text-gray-400 text-center">
              送信ボタンを押すと、お使いのメールアプリが起動します。
            </p>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 mb-4">その他のお問い合わせ方法</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              <a href="mailto:support@unser-inc.com" className="text-indigo-600 hover:underline">support@unser-inc.com</a>
            </div>
            <p className="text-xs text-gray-400">通常1営業日以内にご返信いたします。</p>
          </div>
        </div>
      </main>
    </div>
  );
}
