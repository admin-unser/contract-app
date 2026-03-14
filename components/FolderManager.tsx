"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Folder {
  id: string;
  name: string;
  color: string;
  document_count: number;
}

const FOLDER_COLORS = [
  { label: "青", value: "#3b82f6" },
  { label: "紫", value: "#a855f7" },
  { label: "緑", value: "#22c55e" },
  { label: "赤", value: "#ef4444" },
  { label: "橙", value: "#f97316" },
  { label: "水色", value: "#06b6d4" },
];

export function FolderSidebar() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFolder = searchParams.get("folder");

  useEffect(() => {
    fetchFolders();
  }, []);

  async function fetchFolders() {
    const res = await fetch("/api/folders");
    if (res.ok) setFolders(await res.json());
  }

  async function createFolder() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    if (res.ok) {
      setNewName("");
      setShowCreate(false);
      fetchFolders();
    }
    setCreating(false);
  }

  async function deleteFolder(id: string) {
    if (!confirm("このフォルダを削除しますか？（文書は削除されません）")) return;
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    fetchFolders();
  }

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          フォルダ
        </span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="フォルダを作成"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {showCreate && (
        <div className="mx-3 mb-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="フォルダ名"
            className="w-full text-sm rounded-md border border-gray-300 px-2.5 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <div className="flex items-center gap-1.5 mb-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setNewColor(c.value)}
                className={`w-5 h-5 rounded-full transition-all ${newColor === c.value ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-110"}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={createFolder}
              disabled={creating || !newName.trim()}
              className="flex-1 text-xs py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              作成
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(""); }}
              className="text-xs py-1.5 px-3 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-0.5 ml-4">
        {folders.map((folder) => (
          <div key={folder.id} className="group flex items-center">
            <Link
              href={`/documents?status=completed&folder=${folder.id}`}
              className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                currentFolder === folder.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={folder.color} stroke={folder.color} strokeWidth="1" className="w-4 h-4 flex-shrink-0">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="truncate">{folder.name}</span>
              {folder.document_count > 0 && (
                <span className="text-xs text-gray-400 ml-auto">{folder.document_count}</span>
              )}
            </Link>
            <button
              onClick={() => deleteFolder(folder.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        {folders.length === 0 && !showCreate && (
          <p className="text-[11px] text-gray-400 px-3 py-1">フォルダなし</p>
        )}
      </div>
    </div>
  );
}

// Dropdown for moving a document to a folder
export function FolderSelect({
  documentId,
  currentFolderId,
  onMoved,
}: {
  documentId: string;
  currentFolderId?: string | null;
  onMoved?: () => void;
}) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/folders").then((r) => r.json()).then(setFolders).catch(() => {});
  }, []);

  async function moveToFolder(folderId: string | null) {
    await fetch(`/api/documents/${documentId}/folder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    });
    setOpen(false);
    onMoved?.();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        フォルダに移動
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[180px]">
          <button
            onClick={() => moveToFolder(null)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${!currentFolderId ? "text-blue-600 font-medium" : "text-gray-600"}`}
          >
            フォルダなし
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => moveToFolder(f.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${currentFolderId === f.id ? "text-blue-600 font-medium" : "text-gray-600"}`}
            >
              <div className="w-3 h-3 rounded" style={{ backgroundColor: f.color }} />
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
