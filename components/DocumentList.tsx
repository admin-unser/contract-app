"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { DOCUMENT_CATEGORIES } from "@/lib/types";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "下書き", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "署名待ち", color: "text-orange-600", bgColor: "bg-orange-50" },
  completed: { label: "完了", color: "text-green-600", bgColor: "bg-green-50" },
};

const categoryColors: Record<string, string> = {
  "業務委託": "bg-blue-50 text-blue-600",
  "NDA": "bg-purple-50 text-purple-600",
  "雇用契約": "bg-green-50 text-green-600",
  "売買契約": "bg-orange-50 text-orange-600",
  "賃貸契約": "bg-teal-50 text-teal-600",
  "その他": "bg-gray-100 text-gray-500",
};

interface FolderItem {
  id: string;
  name: string;
  color: string;
  document_count: number;
}

interface DocumentItem {
  id: string;
  title: string;
  status: string;
  category?: string | null;
  folder_id?: string | null;
  created_at: string;
  envelope_signers?: { id: string; email: string; signed_at: string | null; company_name?: string | null }[];
}

function FolderDropdown({
  documentId,
  currentFolderId,
  folders,
  onAssign,
}: {
  documentId: string;
  currentFolderId?: string | null;
  folders: FolderItem[];
  onAssign: (documentId: string, folderId: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function handleSelect(folderId: string | null) {
    if (folderId === (currentFolderId ?? null)) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      await onAssign(documentId, folderId);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        disabled={loading}
        className="flex items-center gap-1 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        title={currentFolder ? `フォルダ: ${currentFolder.name}` : "フォルダに割り当て"}
      >
        {currentFolder && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: currentFolder.color || "#9CA3AF" }}
          />
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-4 h-4"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        {loading && (
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-gray-200 bg-white shadow-lg py-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            フォルダ
          </div>
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
              !currentFolderId ? "text-blue-600 font-medium" : "text-gray-600"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
            フォルダなし
            {!currentFolderId && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-auto">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleSelect(folder.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                currentFolderId === folder.id ? "text-blue-600 font-medium" : "text-gray-600"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: folder.color || "#9CA3AF" }}
              />
              <span className="truncate">{folder.name}</span>
              {currentFolderId === folder.id && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 ml-auto flex-shrink-0">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentList({
  documents,
  filterStatus,
}: {
  documents: DocumentItem[];
  filterStatus?: string;
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [folders, setFolders] = useState<FolderItem[]>([]);

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch folders");
        return res.json();
      })
      .then((data) => setFolders(data))
      .catch(() => {
        // Silently fail - folder feature is optional
      });
  }, []);

  const handleFolderAssign = useCallback(
    async (documentId: string, folderId: string | null) => {
      const res = await fetch(`/api/documents/${documentId}/folder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error("Failed to assign folder");
      router.refresh();
    },
    [router]
  );

  const filtered = categoryFilter
    ? documents.filter((d) => d.category === categoryFilter)
    : documents;

  // Get company names from signers for display
  function getCompanyName(doc: DocumentItem): string | null {
    const companies = doc.envelope_signers
      ?.map((s) => s.company_name)
      .filter(Boolean) as string[] | undefined;
    if (!companies?.length) return null;
    const unique = [...new Set(companies)];
    return unique.join(", ");
  }

  // Build a folder lookup map
  const folderMap = new Map(folders.map((f) => [f.id, f]));

  if (!documents.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <div className="text-gray-300 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          {filterStatus
            ? "該当する文書がありません。"
            : "文書がありません。新規アップロードから契約書を追加してください。"}
        </p>
      </div>
    );
  }

  // Check if any doc has a category
  const hasCategories = documents.some((d) => d.category);

  return (
    <div className="space-y-3">
      {/* Category filter tabs */}
      {hasCategories && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !categoryFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            すべて
          </button>
          {DOCUMENT_CATEGORIES.map((cat) => {
            const count = documents.filter((d) => d.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "" : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            {filterStatus ? statusConfig[filterStatus]?.label ?? "文書" : "最近の文書"}
            <span className="ml-2 text-gray-400 font-normal">({filtered.length}件)</span>
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {filtered.map((doc) => {
            const config = statusConfig[doc.status] ?? statusConfig.draft;
            const signerCount = doc.envelope_signers?.length ?? 0;
            const signedCount = doc.envelope_signers?.filter((s) => s.signed_at).length ?? 0;
            const date = new Date(doc.created_at);
            const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
            const company = getCompanyName(doc);
            const docFolder = doc.folder_id ? folderMap.get(doc.folder_id) : undefined;

            return (
              <li key={doc.id}>
                <div className="flex items-center">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-gray-400 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">{doc.title}</span>
                          {doc.category && (
                            <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[doc.category] ?? "bg-gray-100 text-gray-500"}`}>
                              {doc.category}
                            </span>
                          )}
                          {docFolder && (
                            <span className="flex-shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: docFolder.color || "#9CA3AF" }}
                              />
                              {docFolder.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>{dateStr}</span>
                          {company && (
                            <span className="text-gray-500">{company}</span>
                          )}
                          {signerCount > 0 && (
                            <span>
                              署名: {signedCount}/{signerCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${config.color} ${config.bgColor}`}>
                      {config.label}
                    </span>
                  </Link>
                  {folders.length > 0 && (
                    <div className="pr-3">
                      <FolderDropdown
                        documentId={doc.id}
                        currentFolderId={doc.folder_id}
                        folders={folders}
                        onAssign={handleFolderAssign}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
