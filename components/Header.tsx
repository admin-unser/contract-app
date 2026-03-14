"use client";

import Link from "next/link";

export function Header({ email }: { email: string }) {
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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-full px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {email[0].toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 font-medium">{email}</span>
        </div>
      </div>
    </header>
  );
}
