"use client";

import { useEffect, useState } from "react";
import type { TemplateWithFolder, TemplateFolder } from "@/lib/types";

interface TemplateSelectorProps {
  onSelect: (template: TemplateWithFolder) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateWithFolder[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/templates/folders").then((r) => r.json()),
    ]).then(([t, f]) => {
      setTemplates(t);
      setFolders(f);
      setLoading(false);
    });
  }, []);

  const filtered = selectedFolder
    ? selectedFolder === "uncategorized"
      ? templates.filter((t) => !t.folder_id)
      : templates.filter((t) => t.folder_id === selectedFolder)
    : templates;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">テンプレートから選択</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Folder list */}
          <div className="w-44 border-r border-gray-200 p-2 overflow-y-auto flex-shrink-0">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedFolder === null ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              すべて
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedFolder === f.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {/* Template list */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">テンプレートがありません</div>
            ) : (
              <div className="grid gap-2">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-blue-500">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{t.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {t.template_folders?.name ?? "未分類"}
                        {t.description && ` · ${t.description}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
