import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "プライバシーポリシー | MUSUBI sign",
  description: "MUSUBI sign 電子契約サービスのプライバシーポリシー",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-gray-400 mb-10">最終更新日: 2026年3月16日</p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. はじめに</h2>
            <p className="text-gray-600">
              UNSER合同会社（以下「当社」）は、電子契約サービス「MUSUBI sign」（以下「本サービス」）の提供にあたり、
              ユーザーの個人情報の保護を重要な責務と認識し、以下のとおりプライバシーポリシーを定めます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. 収集する情報</h2>
            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.1 アカウント情報</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>メールアドレス</li>
              <li>氏名（任意）</li>
              <li>企業名・組織名（任意）</li>
              <li>パスワード（暗号化して保存）</li>
            </ul>
            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.2 文書情報</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>アップロードされたPDF文書</li>
              <li>署名データ（手書き署名画像、捺印画像）</li>
              <li>署名者の氏名・メールアドレス</li>
            </ul>
            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.3 利用情報</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>IPアドレス</li>
              <li>ブラウザ・OS情報（ユーザーエージェント）</li>
              <li>アクセス日時</li>
              <li>操作ログ（監査ログ）</li>
            </ul>
            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.4 決済情報</h3>
            <p className="text-gray-600">
              クレジットカード情報はStripe, Inc.が直接処理します。当社はカード番号を保存しません。
              Stripeのプライバシーポリシーは <a href="https://stripe.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a> をご参照ください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. 情報の利用目的</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>本サービスの提供・運営・改善</li>
              <li>ユーザーサポートの提供</li>
              <li>署名依頼・完了通知等のメール送信</li>
              <li>利用状況の分析・統計（匿名化処理後）</li>
              <li>不正利用の検知・防止</li>
              <li>料金の請求・決済処理</li>
              <li>法令に基づく対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. 情報の共有・第三者提供</h2>
            <p className="text-gray-600">当社は、以下の場合を除き、個人情報を第三者に提供しません。</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>サービス提供に必要な業務委託先（以下を含む）</li>
            </ul>
            <div className="mt-3 bg-gray-50 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2 font-medium">委託先</th>
                    <th className="pb-2 font-medium">目的</th>
                    <th className="pb-2 font-medium">所在国</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Supabase</td>
                    <td>データベース・認証・ファイルストレージ</td>
                    <td>米国</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Stripe</td>
                    <td>決済処理</td>
                    <td>米国</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Resend</td>
                    <td>メール送信</td>
                    <td>米国</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Anthropic</td>
                    <td>AI契約リスク分析</td>
                    <td>米国</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Vercel</td>
                    <td>ホスティング・CDN</td>
                    <td>米国</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. データの保管・セキュリティ</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>全通信はTLS 1.3で暗号化</li>
              <li>データベースは暗号化されたストレージに保管</li>
              <li>パスワードはbcryptでハッシュ化</li>
              <li>アクセスは最小権限の原則に基づき制限</li>
              <li>定期的なセキュリティレビューの実施</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. データの保持期間</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>アカウント情報: アカウント存続中および削除後30日</li>
              <li>文書データ: アカウント存続中および削除後30日</li>
              <li>監査ログ: 7年間（法的要件に基づく）</li>
              <li>アクセスログ: 1年間</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. ユーザーの権利</h2>
            <p className="text-gray-600">ユーザーは以下の権利を有します。</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
              <li><strong>アクセス権:</strong> 保有する個人情報の開示を求める権利</li>
              <li><strong>訂正権:</strong> 不正確な個人情報の訂正を求める権利</li>
              <li><strong>削除権:</strong> 個人情報の削除を求める権利</li>
              <li><strong>ポータビリティ権:</strong> 個人情報のエクスポートを求める権利</li>
            </ul>
            <p className="text-gray-600 mt-2">
              これらの権利の行使は、support@unser-inc.com までご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookie</h2>
            <p className="text-gray-600">
              本サービスでは、認証セッションの維持のためにCookieを使用します。
              トラッキング目的のCookieは使用しません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. AI契約リスク分析について</h2>
            <p className="text-gray-600">
              AI契約リスク分析機能をご利用の場合、契約書のテキストがAI分析のためにAnthropicのAPIに送信されます。
              送信されたデータはAnthropicのプライバシーポリシーに従い処理され、AIモデルのトレーニングには使用されません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. ポリシーの変更</h2>
            <p className="text-gray-600">
              当社は、必要に応じて本ポリシーを変更することがあります。
              重要な変更がある場合は、登録メールアドレスへの通知またはサービス内での告知を行います。
            </p>
          </section>

          <section className="pt-4 border-t border-gray-200">
            <p className="text-gray-500">
              <strong>運営会社:</strong> UNSER合同会社<br />
              <strong>個人情報保護責任者:</strong> 代表社員<br />
              <strong>お問い合わせ:</strong> support@unser-inc.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
