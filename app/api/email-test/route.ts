import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// メール送信テスト（デバッグ用）
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to } = await request.json().catch(() => ({ to: null }));
  const testTo = to || user.email;

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = (process.env.EMAIL_FROM ?? "UNSER Sign <noreply@sign.unser-inc.com>").trim();

  if (!apiKey) {
    return NextResponse.json({
      error: "RESEND_API_KEY is not set",
      env: {
        hasKey: false,
        from: fromAddress,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
    }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);

    // まずドメイン一覧を取得
    const domains = await resend.domains.list();

    // テストメール送信
    const result = await resend.emails.send({
      from: fromAddress,
      to: testTo,
      subject: "【テスト】UNSER Sign メール送信テスト",
      html: `<div style="font-family: sans-serif; padding: 24px;">
        <h2>メール送信テスト成功</h2>
        <p>このメールが届いていれば、Resend経由のメール送信は正常に動作しています。</p>
        <p style="color: #666; font-size: 12px;">送信先: ${testTo}<br/>FROM: ${fromAddress}<br/>時刻: ${new Date().toISOString()}</p>
      </div>`,
    });

    return NextResponse.json({
      success: !result.error,
      emailId: result.data?.id,
      error: result.error,
      config: {
        from: fromAddress,
        to: testTo,
        apiKeyPrefix: apiKey.substring(0, 10) + "...",
      },
      domains: domains.data,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      config: {
        from: fromAddress,
        to: testTo,
        apiKeyPrefix: apiKey.substring(0, 10) + "...",
      },
    }, { status: 500 });
  }
}
