import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 | MUSUBI sign",
  description: "MUSUBI sign 電子契約サービスの利用規約",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="MUSUBI sign" width={84} height={28} className="object-contain" style={{ height: 28, width: "auto" }} />
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">利用規約</h1>
        <p className="text-sm text-gray-400 mb-10">最終更新日: 2026年3月16日</p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第1条（適用）</h2>
            <p className="text-gray-600">
              本規約は、UNSER合同会社（以下「当社」）が提供する電子契約サービス「MUSUBI sign」（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは、本規約に同意の上、本サービスを利用するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第2条（定義）</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>「ユーザー」とは、本サービスに登録し、利用する個人または法人をいいます。</li>
              <li>「文書」とは、ユーザーが本サービスにアップロードする電子ファイルをいいます。</li>
              <li>「署名者」とは、文書に対して電子署名を行う者をいいます。</li>
              <li>「組織」とは、ユーザーが属するワークスペース単位をいいます。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第3条（アカウント登録）</h2>
            <ol className="list-decimal pl-5 text-gray-600 space-y-1">
              <li>ユーザーは、真実かつ正確な情報を提供してアカウントを登録するものとします。</li>
              <li>ユーザーは、アカウント情報の管理責任を負い、第三者への貸与・譲渡はできません。</li>
              <li>アカウントの不正使用による損害について、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第4条（サービス内容）</h2>
            <p className="text-gray-600">本サービスは以下の機能を提供します。</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
              <li>PDF文書のアップロードおよび管理</li>
              <li>電子署名の依頼・実行・管理</li>
              <li>署名済み文書のダウンロード</li>
              <li>AI契約リスク分析（対象プランのみ）</li>
              <li>契約期限管理およびアラート通知</li>
              <li>監査ログの記録・閲覧</li>
              <li>テンプレート管理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第5条（料金・支払い）</h2>
            <ol className="list-decimal pl-5 text-gray-600 space-y-1">
              <li>本サービスには無料プランと有料プランがあります。各プランの料金・機能は料金ページに定めます。</li>
              <li>有料プランの料金は月額制とし、Stripeを通じてクレジットカードで決済します。</li>
              <li>プラン変更は即時適用され、日割り計算は行いません。</li>
              <li>解約した場合、現在の請求期間の終了まで有料プランの機能を利用できます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第6条（禁止事項）</h2>
            <p className="text-gray-600">ユーザーは以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mt-2">
              <li>法令に違反する文書の送信・署名</li>
              <li>他のユーザーへのなりすまし</li>
              <li>本サービスのシステムに対する不正アクセスや妨害行為</li>
              <li>本サービスの逆アセンブル、リバースエンジニアリング</li>
              <li>第三者の権利を侵害する行為</li>
              <li>自動化ツール等による大量のリクエスト送信</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第7条（電子署名の法的効力）</h2>
            <p className="text-gray-600">
              本サービスを通じて行われる電子署名は、電子署名及び認証業務に関する法律（電子署名法）に準拠します。
              ただし、電子署名の法的有効性は署名の方法、当事者間の合意、適用法令等により異なる場合があります。
              当社は、特定の文書や署名の法的有効性を保証するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第8条（データの取扱い）</h2>
            <ol className="list-decimal pl-5 text-gray-600 space-y-1">
              <li>ユーザーがアップロードした文書の所有権はユーザーに帰属します。</li>
              <li>当社は、サービス提供に必要な範囲でのみ文書データにアクセスします。</li>
              <li>文書データは暗号化して保管し、適切なセキュリティ措置を講じます。</li>
              <li>アカウント削除時、ユーザーデータは30日以内に完全削除します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第9条（免責事項）</h2>
            <ol className="list-decimal pl-5 text-gray-600 space-y-1">
              <li>当社は、本サービスの完全性、正確性、適法性を保証しません。</li>
              <li>システム障害、メンテナンス等による一時的なサービス停止について、当社は責任を負いません。</li>
              <li>AI契約リスク分析の結果は参考情報であり、法的助言ではありません。重要な契約については専門家にご相談ください。</li>
              <li>当社の損害賠償責任は、直近12ヶ月間にユーザーが当社に支払った金額を上限とします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第10条（サービスの変更・終了）</h2>
            <p className="text-gray-600">
              当社は、事前の通知なく本サービスの内容を変更し、または提供を終了できるものとします。
              ただし、有料プランのユーザーには、サービス終了の30日前までに通知します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第11条（規約の変更）</h2>
            <p className="text-gray-600">
              当社は、必要に応じて本規約を変更できるものとします。
              変更後の規約は、本サービス上に掲示した時点から効力を生じます。
              重要な変更がある場合は、登録メールアドレスへの通知またはサービス内での告知を行います。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">第12条（準拠法・管轄）</h2>
            <p className="text-gray-600">
              本規約は日本法に準拠し、本サービスに関する一切の紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section className="pt-4 border-t border-gray-200">
            <p className="text-gray-500">
              <strong>運営会社:</strong> UNSER合同会社<br />
              <strong>所在地:</strong> 東京都<br />
              <strong>お問い合わせ:</strong> support@unser-inc.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
