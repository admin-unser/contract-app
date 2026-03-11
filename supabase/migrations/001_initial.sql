-- documents: 文書メタデータ
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  title text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- envelope_signers: 署名者
create table if not exists public.envelope_signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  email text not null,
  name text,
  "order" int not null default 0,
  signed_at timestamptz,
  signature_data text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_owner on public.documents(owner_id);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_envelope_signers_document on public.envelope_signers(document_id);

-- RLS
alter table public.documents enable row level security;
alter table public.envelope_signers enable row level security;

-- documents: owner のみアクセス可。署名者は envelope_signers 経由で document を読む必要があるため、別ポリシーで signer にも select を許可
create policy "documents_select_owner" on public.documents
  for select using (auth.uid() = owner_id);

create policy "documents_select_signer" on public.documents
  for select using (
    exists (
      select 1 from public.envelope_signers s
      where s.document_id = documents.id and s.email = (select email from auth.users where id = auth.uid())
    )
  );

create policy "documents_insert" on public.documents
  for insert with check (auth.uid() = owner_id);

create policy "documents_update_owner" on public.documents
  for update using (auth.uid() = owner_id);

-- envelope_signers: document の owner が全操作。署名者は自分の行のみ select と update（署名時）
create policy "envelope_signers_select_owner" on public.envelope_signers
  for select using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "envelope_signers_select_signer" on public.envelope_signers
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

create policy "envelope_signers_insert" on public.envelope_signers
  for insert with check (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "envelope_signers_update_signer" on public.envelope_signers
  for update using (
    email = (select email from auth.users where id = auth.uid())
  );

create policy "envelope_signers_update_owner" on public.envelope_signers
  for update using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

-- Storage bucket (手動で Supabase Dashboard から作成するか、以下で作成)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
-- storage の RLS は Dashboard または別 migration で設定推奨
