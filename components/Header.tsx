"use client";

import Link from "next/link";

export function Header({ email }: { email: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] border-b border-gray-200 bg-white flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <Link href="/documents" className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                <path d="M9 15l2 2 4-4" />
              </svg>
            </div>
            <span className="ml-2 text-lg font-bold text-gray-800">UNSER Sign</span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-500">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="text-sm text-gray-700">{email}</span>
        </div>
      </div>
    </header>
  );
}
