"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function Header({ email }: { email: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] border-b border-gray-200 bg-white/95 backdrop-blur-sm flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <Link href="/documents" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-800 leading-tight">UNSER Sign</span>
            <span className="text-[10px] text-gray-400 leading-tight">電子契約プラットフォーム</span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {email[0].toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 font-medium">{email}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-5 top-full mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-xl py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-800">{email}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">アカウント管理</div>
            </div>

            <div className="py-1">
              <Link
                href="/settings/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                マイページ
              </Link>
              <Link
                href="/settings/company"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                会社情報
              </Link>
              <Link
                href="/settings/members"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-400">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                メンバー管理
              </Link>
            </div>

            <div className="border-t border-gray-100 pt-1">
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
