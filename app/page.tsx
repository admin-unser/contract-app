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
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a365d] to-[#312e81] flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-gray-800 tracking-tight">MUSUBI <span className="font-normal text-lg text-gray-500">sign</span></span>
        </div>
      </div>
      <p className="text-gray-500 mb-8">契約を、結ぶ。電子契約プラットフォーム</p>
      <Link
        href="/login"
        className="rounded-xl bg-gradient-to-r from-[#1a365d] to-[#312e81] px-8 py-3 font-medium text-white hover:opacity-90 transition-all shadow-lg shadow-indigo-900/20"
      >
        ログイン
      </Link>
      <p className="mt-6 text-xs text-gray-400">無料プランあり</p>
    </div>
  );
}
