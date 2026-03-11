-- Storage bucket: documents（非公開）
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- RLS: owner および 署名者 が対象文書のファイルを読める
create policy "documents_storage_select_owner" on storage.objects
  for select using (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents_storage_select_signer" on storage.objects
  for select using (
    bucket_id = 'documents' and exists (
      select 1 from public.documents d
      join public.envelope_signers s on s.document_id = d.id
      where d.file_path = name
        and s.email = (select email from auth.users where id = auth.uid())
    )
  );

create policy "documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents_storage_update_owner" on storage.objects
  for update using (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents_storage_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
  );
