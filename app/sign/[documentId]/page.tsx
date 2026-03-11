import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignForm } from "./SignForm";

export default async function SignPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ signer?: string }>;
}) {
  const { documentId } = await params;
  const { signer: signerId } = await searchParams;
  if (!signerId) notFound();

  const supabase = createAdminClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, file_path, status")
    .eq("id", documentId)
    .single();
  if (!doc) notFound();

  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, email, signed_at")
    .eq("document_id", documentId)
    .eq("id", signerId)
    .single();
  if (!signer || signer.signed_at) notFound();

  const { data: urlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600);
  const pdfUrl = urlData?.signedUrl ?? null;

  return (
    <div className="min-h-screen bg-zinc-100 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-zinc-900">{doc.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            署名者: {signer.email}
          </p>
          <SignForm
            documentId={documentId}
            signerId={signerId}
            pdfUrl={pdfUrl}
          />
        </div>
      </div>
    </div>
  );
}
