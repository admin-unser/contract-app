import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  if (!hash) {
    return NextResponse.json({ error: "hashが必要です。" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Try document_hash first, then chain_hash
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, status, created_at, document_hash, chain_hash")
    .or(`document_hash.eq.${hash},chain_hash.eq.${hash}`)
    .single();

  if (!doc) {
    return NextResponse.json({
      verified: false,
      message: "一致する文書が見つかりません。",
    });
  }

  const { data: signers } = await supabase
    .from("envelope_signers")
    .select("email, name, company_name, signed_at")
    .eq("document_id", doc.id)
    .order("order", { ascending: true });

  return NextResponse.json({
    verified: true,
    document: {
      title: doc.title,
      status: doc.status,
      created_at: doc.created_at,
      document_hash: doc.document_hash,
      chain_hash: doc.chain_hash,
    },
    signers: signers?.map((s) => ({
      name: s.name,
      company_name: s.company_name,
      email: s.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // mask email
      signed_at: s.signed_at,
    })),
  });
}
