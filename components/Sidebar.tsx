"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { FolderSidebar } from "./FolderManager";

interface SidebarProps {
  statusCounts: {
    draft: number;
    sent: number;
    completed: number;
  };
}

export function Sidebar({ statusCounts }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-[var(--header-height)] left-0 bottom-0 w-[var(--sidebar-width)] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Main action button */}
      <div className="p-4">
        <Link
          href="/documents/new"
          className="flex items-center justify-center gap-2.5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          署名を依頼する
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4">
        {/* Home */}
        <Link
          href="/documents"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-1 ${
            pathname === "/documents"
              ? "bg-blue-50 text-blue-700 shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${pathname === "/documents" ? "bg-blue-100" : "bg-gray-100"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          ダッシュボード
        </Link>

        {/* Drafts */}
        <Link
          href="/documents?status=draft"
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all mb-1 text-gray-700 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            下書き
          </div>
          {statusCounts.draft > 0 && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{statusCounts.draft}</span>
          )}
        </Link>

        {/* Templates */}
        <Link
          href="/templates"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-1 ${
            pathname.startsWith("/templates")
              ? "bg-blue-50 text-blue-700 shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${pathname.startsWith("/templates") ? "bg-blue-100" : "bg-gray-100"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          テンプレート
        </Link>

        {/* Separator */}
        <div className="my-3 mx-1 border-t border-gray-100" />

        {/* Signature request status section */}
        <div className="mb-2 px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">契約状況</span>
        </div>

        <Link
          href="/documents?status=sent"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 ml-2 mb-0.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>署名待ち</span>
          </div>
          {statusCounts.sent > 0 && (
            <span className="text-xs font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{statusCounts.sent}</span>
          )}
        </Link>

        <Link
          href="/documents?status=completed"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 ml-2 mb-0.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>完了</span>
          </div>
          {statusCounts.completed > 0 && (
            <span className="text-xs font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{statusCounts.completed}</span>
          )}
        </Link>

        {/* Folders */}
        <div className="mt-3">
          <Suspense fallback={null}>
            <FolderSidebar />
          </Suspense>
        </div>

        {/* Separator */}
        <div className="my-3 mx-1 border-t border-gray-100" />

        {/* Settings */}
        <div className="mb-2 px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">設定</span>
        </div>

        <Link
          href="/settings/email-templates"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ml-2 mb-0.5 ${
            pathname.startsWith("/settings/email-templates")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" />
          </svg>
          メールテンプレート
        </Link>
      </nav>

      {/* Bottom section: Logout */}
      <div className="border-t border-gray-100 p-3">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
