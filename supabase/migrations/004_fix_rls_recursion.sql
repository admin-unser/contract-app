-- Fix infinite RLS recursion and auth.users permission errors
-- Issue 1: Circular RLS between documents <-> envelope_signers/signature_fields/audit_logs
-- Issue 2: Policies referencing auth.users table directly (authenticated role can't access it)
-- Solution: Use SECURITY DEFINER functions and auth.email() instead of auth.users queries

-- Security definer function to check document ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_document_owner(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = doc_id AND d.owner_id = auth.uid()
  );
$$;

-- Security definer function to check if user is a signer without triggering RLS
-- Uses auth.email() (JWT claim) instead of querying auth.users table
CREATE OR REPLACE FUNCTION public.is_signer_of_document(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.envelope_signers s
    WHERE s.document_id = doc_id
      AND s.email = auth.email()
  );
$$;

-- Fix documents policies
DROP POLICY IF EXISTS documents_select_signer ON public.documents;
CREATE POLICY documents_select_signer ON public.documents
  FOR SELECT USING (public.is_signer_of_document(id));

-- Fix envelope_signers policies (owner access via security definer, signer access via auth.email())
DROP POLICY IF EXISTS envelope_signers_select_owner ON public.envelope_signers;
CREATE POLICY envelope_signers_select_owner ON public.envelope_signers
  FOR SELECT USING (public.is_document_owner(document_id));

DROP POLICY IF EXISTS envelope_signers_select_signer ON public.envelope_signers;
CREATE POLICY envelope_signers_select_signer ON public.envelope_signers
  FOR SELECT USING (email = auth.email());

DROP POLICY IF EXISTS envelope_signers_insert ON public.envelope_signers;
CREATE POLICY envelope_signers_insert ON public.envelope_signers
  FOR INSERT WITH CHECK (public.is_document_owner(document_id));

DROP POLICY IF EXISTS envelope_signers_update_owner ON public.envelope_signers;
CREATE POLICY envelope_signers_update_owner ON public.envelope_signers
  FOR UPDATE USING (public.is_document_owner(document_id));

DROP POLICY IF EXISTS envelope_signers_update_signer ON public.envelope_signers;
CREATE POLICY envelope_signers_update_signer ON public.envelope_signers
  FOR UPDATE USING (email = auth.email());

-- Fix signature_fields policies
DROP POLICY IF EXISTS signature_fields_select_owner ON public.signature_fields;
CREATE POLICY signature_fields_select_owner ON public.signature_fields
  FOR SELECT USING (public.is_document_owner(document_id));

DROP POLICY IF EXISTS signature_fields_insert_owner ON public.signature_fields;
CREATE POLICY signature_fields_insert_owner ON public.signature_fields
  FOR INSERT WITH CHECK (public.is_document_owner(document_id));

DROP POLICY IF EXISTS signature_fields_update_owner ON public.signature_fields;
CREATE POLICY signature_fields_update_owner ON public.signature_fields
  FOR UPDATE USING (public.is_document_owner(document_id));

DROP POLICY IF EXISTS signature_fields_delete_owner ON public.signature_fields;
CREATE POLICY signature_fields_delete_owner ON public.signature_fields
  FOR DELETE USING (public.is_document_owner(document_id));

-- Fix audit_logs policy
DROP POLICY IF EXISTS audit_logs_select_owner ON public.audit_logs;
CREATE POLICY audit_logs_select_owner ON public.audit_logs
  FOR SELECT USING (public.is_document_owner(document_id));

-- Fix storage policy for signer access
DROP POLICY IF EXISTS documents_storage_select_signer ON storage.objects;
CREATE POLICY documents_storage_select_signer ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.envelope_signers s ON s.document_id = d.id
      WHERE d.file_path = name AND s.email = auth.email()
    )
  );
