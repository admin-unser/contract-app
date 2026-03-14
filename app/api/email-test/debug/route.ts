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

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = (process.env.EMAIL_FROM ?? "UNSER Sign <noreply@sign.unser-inc.com>").trim();
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
    let domainInfo: unknown = null;
    try {
      const domains = await resend.domains.list();
      domainInfo = domains.data;
    } catch (e) {
      domainInfo = { error: String(e) };
    }

    // 2. テストメール送信
    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject: `【テスト】UNSER Sign メール送信テスト ${new Date().toLocaleTimeString("ja-JP")}`,
      html: `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="width: 32px; height: 32px; background: #1a56db; border-radius: 6px; text-align: center; vertical-align: middle;">
                <span style="color: white; font-weight: bold; font-size: 14px; line-height: 32px;">U</span>
              </td>
              <td style="padding-left: 10px; vertical-align: middle;">
                <span style="font-size: 18px; font-weight: bold; color: #1f2937;">UNSER Sign</span>
              </td>
            </tr>
          </table>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">テスト受信者 様</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          合同会社UNSER より、以下の文書への署名をお願いいたします。
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 13px;">文書名</p>
          <p style="margin: 4px 0 0; color: #1f2937; font-size: 15px; font-weight: 600;">テスト契約書</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="#" style="display: inline-block; background: #1a56db; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
            署名する
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
          このメールは UNSER Sign から自動送信されています。
        </p>
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
      domains: domainInfo,
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
