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

  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, email, name, company_name, signed_at, otp_verified")
    .eq("document_id", documentId)
    .eq("id", resolvedSignerId)
    .single();
  if (!signer || signer.signed_at) notFound();

  // Get document owner name
  const { data: owner } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", (await supabase.from("documents").select("user_id").eq("id", documentId).single()).data?.user_id ?? "")
    .single();

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
      otpVerified={!!signer.otp_verified}
      senderName={owner?.display_name || "送信者"}
      createdAt={doc.created_at}
    />
  );
}
