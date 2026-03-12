-- ============================================================
-- Migration 003: テンプレート、署名フィールド、OTP、監査ログ
-- ============================================================

-- ============================================================
-- 1. 既存テーブルへのカラム追加
-- ============================================================

-- documents: ハッシュ、テンプレート関連、メール本文
alter table public.documents
  add column if not exists document_hash text,
  add column if not exists chain_hash text,
  add column if not exists template_id uuid,
  add column if not exists email_message text;

-- envelope_signers: 会社名、OTP認証、署名トークン
alter table public.envelope_signers
  add column if not exists company_name text,
  add column if not exists otp_verified boolean not null default false,
  add column if not exists signing_token uuid default gen_random_uuid();

-- signing_token にユニーク制約
create unique index if not exists idx_envelope_signers_signing_token
  on public.envelope_signers(signing_token);

-- ============================================================
-- 2. テンプレートフォルダ
-- ============================================================
create table if not exists public.template_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_template_folders_owner on public.template_folders(owner_id);

alter table public.template_folders enable row level security;

create policy "template_folders_select_owner" on public.template_folders
  for select using (auth.uid() = owner_id);

create policy "template_folders_insert_owner" on public.template_folders
  for insert with check (auth.uid() = owner_id);

create policy "template_folders_update_owner" on public.template_folders
  for update using (auth.uid() = owner_id);

create policy "template_folders_delete_owner" on public.template_folders
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- 3. テンプレート
-- ============================================================
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.template_folders(id) on delete set null,
  name text not null,
  description text,
  file_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_templates_owner on public.templates(owner_id);
create index if not exists idx_templates_folder on public.templates(folder_id);

-- documents.template_id の外部キー
alter table public.documents
  add constraint fk_documents_template
  foreign key (template_id) references public.templates(id) on delete set null;

alter table public.templates enable row level security;

create policy "templates_select_owner" on public.templates
  for select using (auth.uid() = owner_id);

create policy "templates_insert_owner" on public.templates
  for insert with check (auth.uid() = owner_id);

create policy "templates_update_owner" on public.templates
  for update using (auth.uid() = owner_id);

create policy "templates_delete_owner" on public.templates
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- 4. 署名フィールド（PDF上の位置情報）
-- ============================================================
create table if not exists public.signature_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_id uuid not null references public.envelope_signers(id) on delete cascade,
  page int not null,
  x float not null,
  y float not null,
  width float not null,
  height float not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signature_fields_document on public.signature_fields(document_id);
create index if not exists idx_signature_fields_signer on public.signature_fields(signer_id);

alter table public.signature_fields enable row level security;

-- オーナーが配置・管理
create policy "signature_fields_select_owner" on public.signature_fields
  for select using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "signature_fields_insert_owner" on public.signature_fields
  for insert with check (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "signature_fields_update_owner" on public.signature_fields
  for update using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "signature_fields_delete_owner" on public.signature_fields
  for delete using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

-- ============================================================
-- 5. メールテンプレート
-- ============================================================
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body_html text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_templates_owner on public.email_templates(owner_id);

alter table public.email_templates enable row level security;

create policy "email_templates_select_owner" on public.email_templates
  for select using (auth.uid() = owner_id);

create policy "email_templates_insert_owner" on public.email_templates
  for insert with check (auth.uid() = owner_id);

create policy "email_templates_update_owner" on public.email_templates
  for update using (auth.uid() = owner_id);

create policy "email_templates_delete_owner" on public.email_templates
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- 6. OTPトークン
-- ============================================================
create table if not exists public.otp_tokens (
  id uuid primary key default gen_random_uuid(),
  signer_id uuid not null references public.envelope_signers(id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_tokens_signer on public.otp_tokens(signer_id);

alter table public.otp_tokens enable row level security;

-- OTPはservice_role経由のみ（RLSポリシーなし = 通常クライアントはアクセス不可）

-- ============================================================
-- 7. 監査ログ
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_id uuid references public.envelope_signers(id) on delete set null,
  action text not null,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_document on public.audit_logs(document_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);

alter table public.audit_logs enable row level security;

-- オーナーのみ閲覧可（INSERT はservice_role経由のみ）
create policy "audit_logs_select_owner" on public.audit_logs
  for select using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

-- ============================================================
-- 8. テンプレート用Storageバケット
-- ============================================================
insert into storage.buckets (id, name, public)
values ('templates', 'templates', false)
on conflict (id) do nothing;

-- テンプレートStorage RLS: オーナーのみ
create policy "templates_storage_select_owner" on storage.objects
  for select using (
    bucket_id = 'templates' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "templates_storage_insert_owner" on storage.objects
  for insert with check (
    bucket_id = 'templates' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "templates_storage_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'templates' and auth.uid()::text = (storage.foldername(name))[1]
  );
