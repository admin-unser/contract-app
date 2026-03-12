import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("owner_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name?.trim() || !body.subject?.trim() || !body.body_html?.trim()) {
    return NextResponse.json({ error: "名前・件名・本文は必須です。" }, { status: 400 });
  }

  // デフォルトにする場合、既存のデフォルトを解除
  if (body.is_default) {
    await supabase
      .from("email_templates")
      .update({ is_default: false })
      .eq("owner_id", user.id)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      owner_id: user.id,
      name: body.name.trim(),
      subject: body.subject.trim(),
      body_html: body.body_html.trim(),
      is_default: body.is_default ?? false,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
