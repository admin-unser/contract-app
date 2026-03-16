import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | MUSUBI sign",
  description: "MUSUBI sign 特定商取引法に基づく表記",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={28} />
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">特定商取引法に基づく表記</h1>
        <p className="text-sm text-gray-400 mb-10">最終更新日: 2026年3月16日</p>

        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["事業者名", "UNSER合同会社"],
                ["代表者", "代表社員"],
                ["所在地", "東京都（詳細はお問い合わせください）"],
                ["電話番号", "お問い合わせフォームよりご連絡ください"],
                ["メールアドレス", "support@unser-inc.com"],
                ["サービスURL", "https://musubi-sign.com（予定）"],
                ["販売価格", "Free: 0円/月、Starter: 2,980円/月（税込）、Business: 5,000円/月（税込）、Enterprise: 個別見積"],
                ["支払方法", "クレジットカード（Stripe経由）"],
                ["支払時期", "サブスクリプション開始時に初回決済、以降毎月自動更新"],
                ["サービス提供時期", "お申込み完了後、即時利用可能"],
                ["返品・キャンセル", "サブスクリプションはいつでも解約可能。解約後は現在の請求期間終了まで利用可能。日割り返金は行いません。"],
                ["動作環境", "最新版のChrome, Safari, Firefox, Edge（デスクトップ・モバイル対応）"],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-200 last:border-0">
                  <th className="text-left font-medium text-gray-700 px-6 py-4 bg-gray-50 w-1/3 align-top">{label}</th>
                  <td className="text-gray-600 px-6 py-4 bg-white">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>上記に記載のない事項については、お問い合わせください。</p>
          <p className="mt-2">お問い合わせ: <a href="mailto:support@unser-inc.com" className="text-indigo-600 hover:underline">support@unser-inc.com</a></p>
        </div>
      </main>
    </div>
  );
}
