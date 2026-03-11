# GitHub リポジトリの作成とプッシュ

## 1. GitHub でリポジトリを新規作成

1. [GitHub](https://github.com/new) の **New repository** を開く
2. **Repository name**: `contract-app`（任意の名前でも可）
3. **Description**: `DocuSign風の契約書締結アプリ MVP`
4. Public を選択
5. **「Add a README file」にはチェックを入れない**（既にローカルに README があるため）
6. **Create repository** をクリック

## 2. リモートを追加してプッシュ

作成後、GitHub に表示される URL を使って、**このプロジェクトのルート**で実行してください。

**HTTPS の場合:**
```bash
cd "/Users/takumia/UNSER corporate"
git remote add origin https://github.com/あなたのユーザー名/contract-app.git
git push -u origin main
```

**SSH の場合:**
```bash
cd "/Users/takumia/UNSER corporate"
git remote add origin git@github.com:あなたのユーザー名/contract-app.git
git push -u origin main
```

`あなたのユーザー名` を実際の GitHub ユーザー名に置き換えてください。

## （任意）GitHub CLI で作成する場合

`gh` が入っていれば、リポジトリ作成とプッシュをまとめて実行できます。

```bash
cd "/Users/takumia/UNSER corporate"
gh repo create contract-app --public --source=. --remote=origin --push --description "DocuSign風の契約書締結アプリ MVP"
```

初回は `gh auth login` でログインが必要です。
