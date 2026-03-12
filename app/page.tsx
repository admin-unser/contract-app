import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/documents");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            <path d="M9 15l2 2 4-4" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-gray-800">UNSER Sign</span>
      </div>
      <p className="text-gray-500 mb-8">電子契約・署名管理システム</p>
      <Link
        href="/login"
        className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors"
      >
        ログイン
      </Link>
      <p className="mt-6 text-xs text-gray-400">社内限定・登録制</p>
    </div>
  );
}
