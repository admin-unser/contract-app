import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/documents");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="MUSUBI sign" width={108} height={36} className="object-contain" style={{ height: 36, width: "auto" }} priority />
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">料金</a>
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">機能</a>
            <a href="#security" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">セキュリティ</a>
            <Link href="/login" className="rounded-lg bg-gradient-to-r from-[#1a365d] to-[#312e81] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-all">
              ログイン
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700 font-medium mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>
            無料で始められます
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            契約を、<span className="bg-gradient-to-r from-[#1a365d] to-[#6366f1] bg-clip-text text-transparent">結ぶ</span>。
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            MUSUBI signは、契約書の作成から署名、管理までをワンストップで実現する電子契約プラットフォームです。
            AI契約リスク検出機能で、見落としリスクを未然に防ぎます。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#1a365d] to-[#312e81] px-8 py-3.5 text-base font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-indigo-900/20"
            >
              無料で始める
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto rounded-xl border-2 border-gray-200 px-8 py-3.5 text-base font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
            >
              機能を見る
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-400">クレジットカード不要 ・ 月5件まで無料</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            SSL/TLS暗号化
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M9 12l2 2 4-4" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
            改ざん検知ハッシュ
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></svg>
            監査ログ完備
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            即時署名完了
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">必要な機能を、すべて。</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">契約業務のあらゆるステップを、一つのプラットフォームでカバーします。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "M14 3v4a1 1 0 0 0 1 1h4M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z",
                title: "PDF署名",
                desc: "PDFをアップロードするだけ。署名・捺印フィールドをドラッグ＆ドロップで配置し、メールまたはリンクで署名依頼。",
              },
              {
                icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
                title: "改ざん防止",
                desc: "文書ハッシュとチェーンハッシュで完全性を保証。署名後の改ざんを検知し、法的有効性を担保します。",
              },
              {
                icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                title: "AI契約リスク検出",
                desc: "Claude AIが契約書を分析し、不利な条項・欠落条項・リスクポイントを自動検出。見落としを防ぎます。",
              },
              {
                icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
                title: "メール通知",
                desc: "署名依頼・完了通知・リマインダーを自動送信。カスタムメールテンプレートで企業ブランドを維持。",
              },
              {
                icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
                title: "テンプレートライブラリ",
                desc: "NDA・業務委託・雇用契約など8種のプリセットテンプレート。よく使う契約書をテンプレ化して効率UP。",
              },
              {
                icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z",
                title: "監査ログ・証跡",
                desc: "誰が、いつ、どのIPから署名したかを完全記録。法的証拠としても有効な監査ログを自動生成。",
              },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 p-6 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" className="w-5 h-5">
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">3ステップで署名完了</h2>
            <p className="mt-4 text-gray-500">複雑な設定は不要。すぐに使い始められます。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "PDFをアップロード", desc: "契約書PDFをドラッグ＆ドロップ。署名者の名前とメールアドレスを追加します。" },
              { step: "2", title: "署名欄を配置", desc: "署名・捺印・日付などのフィールドをPDF上にドラッグ＆ドロップで配置します。" },
              { step: "3", title: "送信して完了", desc: "署名依頼メールが自動送信され、全員が署名完了すると通知が届きます。" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a365d] to-[#312e81] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-900/20">
                  <span className="text-white font-extrabold text-xl">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">シンプルな料金体系</h2>
            <p className="mt-4 text-gray-500">必要な分だけ。隠れたコストはありません。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Free", price: "0", note: "円 / 月", features: ["月5件まで送信", "1ユーザー", "テンプレート3件", "基本署名機能"], highlighted: false },
              { name: "Starter", price: "2,980", note: "円 / 月", features: ["月30件まで送信", "3ユーザーまで", "テンプレート20件", "AI契約リスク検出", "カスタムメール", "監査ログ"], highlighted: true },
              { name: "Business", price: "5,000", note: "円 / 月", features: ["送信無制限", "ユーザー無制限", "テンプレート無制限", "API連携", "Webhook", "Starterの全機能"], highlighted: false },
              { name: "Enterprise", price: "要相談", note: "", features: ["Businessの全機能", "SSO / SAML認証", "専任サポート", "カスタム契約", "SLA保証"], highlighted: false },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border-2 p-6 ${p.highlighted ? "border-indigo-500 bg-indigo-50/30 shadow-xl shadow-indigo-500/10 relative" : "border-gray-200 bg-white"}`}>
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    おすすめ
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <div className="mt-3 mb-5">
                  <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                  {p.note && <span className="text-sm text-gray-500 ml-1">{p.note}</span>}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={p.highlighted ? "#6366f1" : "#9ca3af"} strokeWidth="2" className="w-4 h-4 mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {p.name === "Enterprise" ? (
                  <a href="mailto:info@unser-inc.com?subject=MUSUBI sign Enterprise" className="block w-full py-2.5 text-center text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                    お問い合わせ
                  </a>
                ) : (
                  <Link href="/login" className={`block w-full py-2.5 text-center text-sm font-bold rounded-lg transition-all ${p.highlighted ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/20" : "text-gray-700 bg-gray-100 hover:bg-gray-200"}`}>
                    {p.price === "0" ? "無料で始める" : "無料トライアル"}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">エンタープライズレベルのセキュリティ</h2>
            <p className="mt-4 text-gray-500">大切な契約書を、最高水準のセキュリティで守ります。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "通信暗号化", desc: "全通信をTLS 1.3で暗号化。HSTS Preloadリストに登録し、常時HTTPS接続を強制します。" },
              { title: "文書改ざん検知", desc: "SHA-256ハッシュチェーンで文書の完全性を保証。署名後の改ざんを即座に検知します。" },
              { title: "DDoS対策", desc: "IPベースのレート制限とボットスキャナー検知で、不正アクセスを自動ブロック。" },
              { title: "CSP / XSS防御", desc: "Content Security Policyで不正スクリプトの実行を防止。XSS攻撃を多層的にブロック。" },
              { title: "OTP認証", desc: "署名時のワンタイムパスワード認証で、なりすまし署名を防止します。" },
              { title: "監査ログ", desc: "全操作をIP・ユーザーエージェント付きで記録。法的証拠として利用可能です。" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">契約業務を、もっとスマートに。</h2>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto">
            MUSUBI signで、紙の契約書から解放されましょう。
            無料プランから始めて、ビジネスの成長に合わせてアップグレード。
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-gradient-to-r from-[#1a365d] to-[#312e81] px-10 py-4 text-lg font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-indigo-900/20"
          >
            今すぐ無料で始める
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="MUSUBI sign" width={84} height={28} className="object-contain" style={{ height: 28, width: "auto" }} />
              </div>
              <p className="text-sm text-gray-400">契約を、結ぶ。</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">プロダクト</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-700 transition-colors">機能</a></li>
                <li><a href="#pricing" className="hover:text-gray-700 transition-colors">料金</a></li>
                <li><a href="#security" className="hover:text-gray-700 transition-colors">セキュリティ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">法的情報</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/terms" className="hover:text-gray-700 transition-colors">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-700 transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/legal" className="hover:text-gray-700 transition-colors">特定商取引法に基づく表記</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3">サポート</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="mailto:support@unser-inc.com" className="hover:text-gray-700 transition-colors">お問い合わせ</a></li>
                <li><Link href="/contact" className="hover:text-gray-700 transition-colors">サポート</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} UNSER LLC. All rights reserved.</p>
            <p className="text-xs text-gray-400">Powered by MUSUBI sign</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
