-- Add missing DELETE RLS policies for documents, envelope_signers, and audit_logs
-- Without these policies, document deletion is silently blocked by RLS

-- documents: owner can delete their own documents
CREATE POLICY "documents_delete_owner" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- envelope_signers: owner can delete signers on their documents
DROP POLICY IF EXISTS envelope_signers_delete_owner ON public.envelope_signers;
CREATE POLICY "envelope_signers_delete_owner" ON public.envelope_signers
  FOR DELETE USING (public.is_document_owner(document_id));

-- audit_logs: owner can delete logs for their documents
DROP POLICY IF EXISTS audit_logs_delete_owner ON public.audit_logs;
CREATE POLICY "audit_logs_delete_owner" ON public.audit_logs
  FOR DELETE USING (public.is_document_owner(document_id));
