"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UsageStats {
  totalDocuments: number;
  sentDocuments: number;
  completedDocuments: number;
  draftDocuments: number;
}

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [stats, setStats] = useState<UsageStats>({
    totalDocuments: 0,
    sentDocuments: 0,
    completedDocuments: 0,
    draftDocuments: 0,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || "");

      // Fetch usage stats
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalDocuments: (data.statusCounts?.draft || 0) + (data.statusCounts?.sent || 0) + (data.statusCounts?.completed || 0),
            sentDocuments: data.statusCounts?.sent || 0,
            completedDocuments: data.statusCounts?.completed || 0,
            draftDocuments: data.statusCounts?.draft || 0,
          });
        }
      } catch { /* ignore */ }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName, full_name: displayName },
      });
      if (error) throw error;
      setMessage({ type: "success", text: "プロフィールを更新しました。" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "更新に失敗しました。" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 4) {
      setMessage({ type: "error", text: "パスワードは4文字以上で入力してください。" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "パスワードが一致しません。" });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "パスワードを変更しました。" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "パスワード変更に失敗しました。" });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">マイページ</h1>
        <p className="text-sm text-gray-500 mt-1">アカウント情報の確認・変更</p>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* 利用状況 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500">
              <path d="M21 12V7H5a2 2 0 010-4h14v4" /><path d="M3 5v14a2 2 0 002 2h16v-5" /><path d="M18 12a2 2 0 000 4h4v-4z" />
            </svg>
            利用状況
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-100">
          <div className="px-6 py-5 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.totalDocuments}</div>
            <div className="text-xs text-gray-500 mt-1">総文書数</div>
          </div>
          <div className="px-6 py-5 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sentDocuments}</div>
            <div className="text-xs text-gray-500 mt-1">送信済み</div>
          </div>
          <div className="px-6 py-5 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedDocuments}</div>
            <div className="text-xs text-gray-500 mt-1">完了</div>
          </div>
          <div className="px-6 py-5 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.draftDocuments}</div>
            <div className="text-xs text-gray-500 mt-1">下書き</div>
          </div>
        </div>
      </div>

      {/* プロフィール */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            プロフィール
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">メールアドレスの変更はサポートにお問い合わせください。</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:shadow-md disabled:opacity-50 transition-all"
            >
              {saving ? "保存中..." : "プロフィールを保存"}
            </button>
          </div>
        </div>
      </form>

      {/* パスワード変更 */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            パスワード変更
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワードを入力"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード確認</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="px-6 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all"
            >
              {savingPassword ? "変更中..." : "パスワードを変更"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
