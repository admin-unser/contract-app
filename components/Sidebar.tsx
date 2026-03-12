"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          署名を依頼する
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4">
        {/* Home */}
        <Link
          href="/documents"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1 ${
            pathname === "/documents"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          ホーム
        </Link>

        {/* Drafts */}
        <Link
          href="/documents?status=draft"
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors mb-1 ${
            pathname === "/documents" && typeof window !== "undefined"
              ? "text-gray-700 hover:bg-gray-50"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            下書き
          </div>
          {statusCounts.draft > 0 && (
            <span className="text-xs text-gray-500">{statusCounts.draft}</span>
          )}
        </Link>

        {/* Templates */}
        <Link
          href="/templates"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1 ${
            pathname.startsWith("/templates")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          テンプレート
        </Link>

        {/* Signature request status section */}
        <div className="mt-4 mb-2 px-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
            署名依頼の状況
          </div>
        </div>

        <Link
          href="/documents?status=sent"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 ml-4 mb-0.5"
        >
          <span>署名待ち</span>
          <span className="text-xs text-gray-400">{statusCounts.sent}</span>
        </Link>

        <Link
          href="/documents?status=completed"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 ml-4 mb-0.5"
        >
          <span>完了</span>
          <span className="text-xs text-gray-400">{statusCounts.completed}</span>
        </Link>
        {/* Settings section */}
        <div className="mt-4 mb-2 px-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            設定
          </div>
        </div>

        <Link
          href="/settings/email-templates"
          className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors ml-4 mb-0.5 ${
            pathname.startsWith("/settings/email-templates")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          メールテンプレート
        </Link>
      </nav>

      {/* Bottom section: Logout */}
      <div className="border-t border-gray-200 p-3">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 w-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
