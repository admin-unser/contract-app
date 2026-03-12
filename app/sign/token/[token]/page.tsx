import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function TokenSignPage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  // signing_token から signer を検索
  const { data: signer } = await supabase
    .from("envelope_signers")
    .select("id, document_id")
    .eq("signing_token", token)
    .single();

  if (!signer) {
    notFound();
  }

  // 既存の署名ページにリダイレクト（tokenをクエリパラメータとして渡す）
  redirect(`/sign/${signer.document_id}?token=${token}`);
}
