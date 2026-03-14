import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignPageClient } from "./SignPageClient";
import type { SignatureField } from "@/lib/types";

export default async function SignPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ signer?: string; token?: string }>;
}) {
  const { documentId } = await params;
  const { signer: signerId, token } = await searchParams;

  const supabase = createAdminClient();

  // token-based or legacy signer-id-based lookup
  let resolvedSignerId: string | null = null;
  if (token) {
    const { data: signerByToken } = await supabase
      .from("envelope_signers")
      .select("id, document_id, signed_at")
      .eq("signing_token", token)
      .single();
    if (!signerByToken || signerByToken.document_id !== documentId || signerByToken.signed_at) {
      notFound();
    }
    resolvedSignerId = signerByToken.id;
  } else if (signerId) {
    resolvedSignerId = signerId;
  } else {
    notFound();
  }

  if (!resolvedSignerId) notFound();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, file_path, status, created_at")
    .eq("id", documentId)
    .single();
  if (!doc) notFound();

  // Check if signing link has expired (30 days)
  const isExpired = new Date(doc.created_at).getTime() + 30 * 24 * 60 * 60 * 1000 < Date.now();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">この署名リンクは期限切れです</h1>
          <p className="text-sm text-gray-500">署名リンクの有効期限（30日間）が過ぎました。送信者にお問い合わせください。</p>
        </div>
      </div>
    );
  }

  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, email, name, company_name, signed_at")
    .eq("document_id", documentId)
    .eq("id", resolvedSignerId)
    .single();
  if (!signer || signer.signed_at) notFound();

  // Get document owner name
  let senderName = "送信者";
  const { data: docOwner } = await supabase.from("documents").select("owner_id").eq("id", documentId).single();
  if (docOwner) {
    const { data: ownerUser } = await supabase.auth.admin.getUserById(docOwner.owner_id);
    senderName = ownerUser?.user?.user_metadata?.company_name || ownerUser?.user?.user_metadata?.display_name || ownerUser?.user?.email || "送信者";
  }

  const { data: urlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600);
  const pdfUrl = urlData?.signedUrl ?? null;

  // Get signature fields for this signer
  const { data: fields } = await supabase
    .from("signature_fields")
    .select("id, page, x, y, width, height, signer_id, field_type, label, field_value")
    .eq("document_id", documentId)
    .eq("signer_id", resolvedSignerId)
    .order("page", { ascending: true });

  return (
    <SignPageClient
      documentId={documentId}
      documentTitle={doc.title}
      signerId={resolvedSignerId}
      token={token ?? null}
      pdfUrl={pdfUrl}
      fields={(fields as SignatureField[]) ?? []}
      signerName={signer.name || signer.email.split("@")[0]}
      signerEmail={signer.email}
      companyName={signer.company_name || undefined}
      senderName={senderName}
      createdAt={doc.created_at}
    />
  );
}
