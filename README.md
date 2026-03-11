# 契約書締結アプリ（DocuSign風 MVP）

Next.js + Supabase で動く電子契約の MVP です。文書アップロード・署名者指定・電子署名・完了・ダウンロードまで一通り利用できます。

## 機能

- **認証**: メール/パスワードでサインアップ・ログイン（Supabase Auth）
- **文書**: PDF アップロード、タイトル・署名者メール（複数可）の指定
- **署名**: 署名者に渡すリンクからアクセスし、名前入力 or 手書きで署名
- **完了**: 全員署名でステータスが「完了」に。完了版 PDF をダウンロード可能

## セットアップ

### 1. リポジトリと依存関係

```bash
cd "UNSER corporate"
npm install
```

### 2. Supabase プロジェクト

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. **Authentication** で「Email」を有効化（パスワードでサインアップできるようにする）
3. **SQL Editor** で以下を順に実行:
   - `supabase/migrations/001_initial.sql` の内容
   - `supabase/migrations/002_storage.sql` の内容
4. **Storage** でバケット `documents` が作成されていることを確認（migration で自動作成される想定）

### 3. 環境変数

`.env.local.example` をコピーして `.env.local` を作成し、値を設定します。

```bash
cp .env.local.example .env.local
```

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクトの URL（Project Settings → API） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key（同上） |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key（署名フロー用・サーバー専用） |

`SUPABASE_SERVICE_ROLE_KEY` は **クライアントに渡さず**、サーバー側の署名用 API と署名ページでのみ使用しています。

### 4. 起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で開き、新規登録 → ログイン → 文書アップロード → 署名者メール入力 → 「リンクをコピー」で署名者に共有 → 署名完了後にダウンロード、という流れで利用できます。

## 注意事項・今後の拡張

- **署名リンク**: 現在は `signer`（UUID）のみで識別しています。改ざん・期限チェックを行う場合は、署名付きトークンや有効期限付きリンクの導入を検討してください。
- **メール送信**: 署名依頼メールは未実装です。リンクをコピーして手動で共有してください。必要なら Resend / SendGrid 等で送信 API を追加できます。
- **電子署名の法的効力**: 本番で法的効力を求める場合は、タイムスタンプや証明書機関との連携など別途検討が必要です。

## Vercel へデプロイ

1. **初回のみ** ターミナルでログイン（ブラウザが開きます）:
   ```bash
   npx vercel login
   ```
2. 本番デプロイ:
   ```bash
   npm run deploy
   ```
   または `npx vercel --prod`

3. **環境変数**: Vercel のダッシュボードでプロジェクトを開き、**Settings → Environment Variables** に以下を追加してください。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - （任意）`NEXT_PUBLIC_APP_URL` … デプロイ後の URL（例: `https://xxx.vercel.app`）。ログアウト後のリダイレクト先に使います。

4. デプロイ後、Supabase の **Authentication → URL Configuration** で **Site URL** に Vercel の URL を設定し、**Redirect URLs** に `https://あなたのドメイン/**` を追加してください。

## 技術スタック

- Next.js 14（App Router）、TypeScript、Tailwind CSS
- Supabase（Auth / PostgreSQL / Storage）
- pdf-lib（完了版 PDF への署名焼き付け）
