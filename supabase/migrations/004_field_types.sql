-- ============================================================
-- Migration 004: フィールドタイプ追加（署名・氏名・会社名・住所・日付・印影・テキスト・チェックボックス）
-- ============================================================

-- signature_fields に field_type カラム追加
alter table public.signature_fields
  add column if not exists field_type text not null default 'signature';

-- label（任意のカスタムラベル）
alter table public.signature_fields
  add column if not exists label text;

-- field_value（署名時に入力された値を保存）
alter table public.signature_fields
  add column if not exists field_value text;

-- comment: field_type = 'signature' | 'name' | 'company' | 'address' | 'date' | 'stamp' | 'text' | 'checkbox'
