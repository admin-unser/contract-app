import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="mb-6">
        <Logo height={48} />
      </div>
      <h1 className="text-6xl font-extrabold text-gray-200 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-900 mb-2">ページが見つかりません</h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-[#1a365d] to-[#312e81] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-all"
        >
          トップページへ
        </Link>
        <Link
          href="/documents"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          ダッシュボード
        </Link>
      </div>
    </div>
  );
}
