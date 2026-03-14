import { NextResponse } from "next/server";
import { Resend } from "resend";

// 認証不要のメール送信デバッグAPI（秘密のパスワードで保護）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // 簡易保護
  if (secret !== "unser2024debug") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM ?? "UNSER Sign <onboarding@resend.dev>";
  const to = searchParams.get("to") || "takumia@unser-inc.com";

  if (!apiKey) {
    return NextResponse.json({
      error: "RESEND_API_KEY is not set",
      hasKey: false,
      from: fromAddress,
    }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);

    // 1. ドメイン一覧を確認
    const domains = await resend.domains.list();

    // 2. テストメール送信
    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject: `【テスト】UNSER Sign メール送信テスト ${new Date().toLocaleTimeString("ja-JP")}`,
      html: `<div style="font-family: sans-serif; padding: 24px;">
        <h2 style="color: #1a56db;">UNSER Sign メール送信テスト</h2>
        <p>このメールが届いていれば、Resend経由のメール送信は正常に動作しています。</p>
        <table style="border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 4px 12px; color: #666;">送信先</td><td style="padding: 4px 12px;">${to}</td></tr>
          <tr><td style="padding: 4px 12px; color: #666;">FROM</td><td style="padding: 4px 12px;">${fromAddress}</td></tr>
          <tr><td style="padding: 4px 12px; color: #666;">時刻</td><td style="padding: 4px 12px;">${new Date().toISOString()}</td></tr>
          <tr><td style="padding: 4px 12px; color: #666;">APIキー</td><td style="padding: 4px 12px;">${apiKey.substring(0, 12)}...</td></tr>
        </table>
      </div>`,
    });

    return NextResponse.json({
      success: !result.error,
      emailId: result.data?.id,
      resendError: result.error,
      config: {
        from: fromAddress,
        to,
        apiKeyPrefix: apiKey.substring(0, 12) + "...",
      },
      domains: domains.data?.map(d => ({
        name: d.name,
        status: d.status,
        region: d.region,
      })),
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? { message: err.message, stack: err.stack?.split("\n").slice(0, 3) } : String(err),
      config: {
        from: fromAddress,
        to,
        apiKeyPrefix: apiKey.substring(0, 12) + "...",
      },
    }, { status: 500 });
  }
}
