"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TemplateWithFolder, TemplateFolder } from "@/lib/types";
import { PRESET_TEMPLATES, PRESET_CATEGORIES } from "@/lib/preset-templates";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateWithFolder[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPresets, setShowPresets] = useState(true);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [tRes, fRes] = await Promise.all([
      fetch("/api/templates"),
      fetch("/api/templates/folders"),
    ]);
    if (tRes.ok) setTemplates(await tRes.json());
    if (fRes.ok) setFolders(await fRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function createFolder() {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/templates/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    if (res.ok) {
      setNewFolderName("");
      setShowFolderInput(false);
      loadData();
    }
  }

  async function deleteFolder(id: string) {
    if (!confirm("このフォルダを削除しますか？（テンプレートは未分類になります）")) return;
    await fetch("/api/templates/folders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (selectedFolder === id) setSelectedFolder(null);
    loadData();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("このテンプレートを削除しますか？")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    loadData();
  }

  const filtered = selectedFolder
    ? templates.filter((t) => t.folder_id === selectedFolder)
    : templates;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/documents" className="hover:text-blue-600 transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-gray-800">テンプレート</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">テンプレート管理</h1>
        <Link
          href="/templates/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新規テンプレート
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Folder sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">フォルダ</span>
              <button
                onClick={() => setShowFolderInput(!showFolderInput)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            <div className="p-2">
              {showFolderInput && (
                <div className="flex gap-1 mb-2 px-1">
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createFolder()}
                    placeholder="フォルダ名"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={createFolder} className="text-blue-600 hover:text-blue-700 text-sm font-medium px-1">
                    追加
                  </button>
                </div>
              )}
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedFolder === null ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                すべて ({templates.length})
              </button>
              <button
                onClick={() => setSelectedFolder("uncategorized")}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedFolder === "uncategorized" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                未分類 ({templates.filter((t) => !t.folder_id).length})
              </button>
              {folders.map((f) => (
                <div key={f.id} className="flex items-center group">
                  <button
                    onClick={() => setSelectedFolder(f.id)}
                    className={`flex-1 text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                      selectedFolder === f.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {f.name} ({templates.filter((t) => t.folder_id === f.id).length})
                  </button>
                  <button
                    onClick={() => deleteFolder(f.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template list */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto text-gray-300 mb-3">
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">テンプレートがありません</p>
              <Link href="/templates/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                最初のテンプレートを作成
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {(selectedFolder === "uncategorized"
                ? filtered.filter((t) => !t.folder_id)
                : filtered
              ).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-blue-500">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{t.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {t.template_folders?.name ?? "未分類"}
                        {t.description && ` · ${t.description}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/documents/new?template=${t.id}`}
                      className="rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      この文書で送信
                    </Link>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preset Templates Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-2 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-gray-400 transition-transform ${showPresets ? "rotate-90" : ""}`}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">プリセットテンプレート</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{PRESET_TEMPLATES.length}種類</span>
            </button>

            {showPresets && (
              <>
                {/* Category filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setPresetCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      presetCategory === null ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    すべて
                  </button>
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPresetCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        presetCategory === cat.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Preset grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRESET_TEMPLATES
                    .filter((t) => !presetCategory || t.category === presetCategory)
                    .map((preset) => {
                      const cat = PRESET_CATEGORIES.find((c) => c.id === preset.category);
                      return (
                        <div
                          key={preset.id}
                          className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-indigo-500">
                                <path d={preset.icon} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-gray-800">{preset.name}</h3>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{cat?.name}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                                <span>{preset.fields.length}フィールド</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <Link
                              href={`/documents/new?preset=${preset.id}`}
                              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              このテンプレートで契約作成
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
