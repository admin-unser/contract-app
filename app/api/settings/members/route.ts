import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Try to fetch team members; if table doesn't exist, return just the current user
  const { data, error } = await admin
    .from("team_members")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    // Table might not exist yet - return current user as fallback
    return NextResponse.json([
      {
        id: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        owner_id: user.id,
        created_at: user.created_at,
      },
    ]);
  }

  // Always include the owner as the first member if not already in the list
  const ownerExists = data.some((m: any) => m.email === user.email);
  if (!ownerExists) {
    data.unshift({
      id: user.id,
      email: user.email,
      role: "admin",
      status: "active",
      owner_id: user.id,
      created_at: user.created_at,
    });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();
  const role = body.role ?? "member";

  if (!email) {
    return NextResponse.json({ error: "メールアドレスは必須です。" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "有効なメールアドレスを入力してください。" }, { status: 400 });
  }

  if (email === user.email) {
    return NextResponse.json({ error: "自分自身を招待することはできません。" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check if already invited
  const { data: existing } = await admin
    .from("team_members")
    .select("id")
    .eq("owner_id", user.id)
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に招待済みです。" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("team_members")
    .insert({
      owner_id: user.id,
      email,
      role,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    // If table doesn't exist, provide helpful message
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      return NextResponse.json(
        {
          error:
            "team_members テーブルが存在しません。Supabase で以下のSQLを実行してください:\n\nCREATE TABLE team_members (\n  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n  owner_id uuid REFERENCES auth.users(id) NOT NULL,\n  email text NOT NULL,\n  role text NOT NULL DEFAULT 'member',\n  status text NOT NULL DEFAULT 'pending',\n  created_at timestamptz DEFAULT now()\n);\n\nALTER TABLE team_members ENABLE ROW LEVEL SECURITY;",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "IDが必要です。" }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
