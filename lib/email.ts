import { Resend } from "resend";

const IS_DEV_MODE = !process.env.RESEND_API_KEY;

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_ADDRESS = (process.env.EMAIL_FROM ?? "UNSER Sign <onboarding@resend.dev>").trim();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Dev-mode: log email to console instead of sending */
async function devSendEmail(params: { to: string; subject: string; html: string }) {
  console.log("\n========== [DEV EMAIL] ==========");
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log(`Body (text preview): ${params.html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").slice(0, 300)}...`);
  console.log("==================================\n");
  return { data: { id: `dev-${Date.now()}` }, error: null };
}

interface SendSigningRequestParams {
  signerEmail: string;
  signerName: string | null;
  signerCompany: string | null;
  documentTitle: string;
  signingToken: string;
  senderName: string;
  customMessage?: string | null;
}

export async function sendSigningRequest(params: SendSigningRequestParams) {
  const {
    signerEmail,
    signerName,
    signerCompany,
    documentTitle,
    signingToken,
    senderName,
    customMessage,
  } = params;

  const signingUrl = `${APP_URL}/sign/token/${signingToken}`;
  const displayName = signerName || signerEmail;

  const subject = `【署名依頼】${documentTitle}`;

  const body = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: #1a56db; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 14px;">U</span>
          </div>
          <span style="font-size: 18px; font-weight: bold; color: #1f2937;">UNSER Sign</span>
        </div>
      </div>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        ${displayName} 様${signerCompany ? `（${signerCompany}）` : ""}
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        ${senderName} より、以下の文書への署名をお願いいたします。
      </p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">文書名</p>
        <p style="margin: 4px 0 0; color: #1f2937; font-size: 15px; font-weight: 600;">${documentTitle}</p>
      </div>
      ${customMessage ? `
      <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">メッセージ</p>
        <p style="margin: 4px 0 0; color: #374151; font-size: 14px; white-space: pre-wrap;">${customMessage}</p>
      </div>` : ""}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${signingUrl}" style="display: inline-block; background: #1a56db; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
          署名する
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
        このメールは UNSER Sign から自動送信されています。
      </p>
    </div>
  `;

  if (IS_DEV_MODE) return devSendEmail({ to: signerEmail, subject, html: body });
  const result = await getResend().emails.send({ from: FROM_ADDRESS, to: signerEmail, subject, html: body });
  if (result.error) {
    console.error("[Resend Error] sendSigningRequest:", JSON.stringify(result.error));
    throw new Error(result.error.message || "メール送信に失敗しました");
  }
  console.log("[Resend OK] Sent signing request to", signerEmail, "id:", result.data?.id);
  return result;
}

interface SendCompletionNotificationParams {
  ownerEmail: string;
  documentTitle: string;
  documentId: string;
  signerCount: number;
}

export async function sendCompletionNotification(params: SendCompletionNotificationParams) {
  const { ownerEmail, documentTitle, documentId, signerCount } = params;
  const documentUrl = `${APP_URL}/documents/${documentId}`;

  const body = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: #1a56db; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 14px;">U</span>
          </div>
          <span style="font-size: 18px; font-weight: bold; color: #1f2937;">UNSER Sign</span>
        </div>
      </div>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #059669; font-size: 15px; font-weight: 600;">全員の署名が完了しました</p>
      </div>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">文書名</p>
        <p style="margin: 4px 0 0; color: #1f2937; font-size: 15px; font-weight: 600;">${documentTitle}</p>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">署名者数: ${signerCount}名</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${documentUrl}" style="display: inline-block; background: #1a56db; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
          文書を確認する
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
        このメールは UNSER Sign から自動送信されています。
      </p>
    </div>
  `;

  const subject = `【署名完了】${documentTitle}`;
  if (IS_DEV_MODE) return devSendEmail({ to: ownerEmail, subject, html: body });
  const result = await getResend().emails.send({ from: FROM_ADDRESS, to: ownerEmail, subject, html: body });
  if (result.error) {
    console.error("[Resend Error] sendCompletionNotification:", JSON.stringify(result.error));
    throw new Error(result.error.message || "メール送信に失敗しました");
  }
  console.log("[Resend OK] Sent completion notification to", ownerEmail, "id:", result.data?.id);
  return result;
}

interface SendOtpEmailParams {
  signerEmail: string;
  signerName: string | null;
  code: string;
  documentTitle: string;
}

export async function sendOtpEmail(params: SendOtpEmailParams) {
  const { signerEmail, signerName, code, documentTitle } = params;
  const displayName = signerName || signerEmail;

  const body = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: #1a56db; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 14px;">U</span>
          </div>
          <span style="font-size: 18px; font-weight: bold; color: #1f2937;">UNSER Sign</span>
        </div>
      </div>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        ${displayName} 様
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        「${documentTitle}」への署名にあたり、本人確認コードをお送りします。
      </p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">認証コード</p>
        <p style="margin: 0; color: #1f2937; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">
        このコードは10分間有効です。心当たりのない場合はこのメールを無視してください。
      </p>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
        このメールは UNSER Sign から自動送信されています。
      </p>
    </div>
  `;

  const subject = `【認証コード】UNSER Sign: ${code}`;
  if (IS_DEV_MODE) {
    console.log(`\n🔑 [DEV OTP] Code for ${signerEmail}: ${code}\n`);
    return devSendEmail({ to: signerEmail, subject, html: body });
  }
  const result = await getResend().emails.send({ from: FROM_ADDRESS, to: signerEmail, subject, html: body });
  if (result.error) {
    console.error("[Resend Error] sendOtpEmail:", JSON.stringify(result.error));
    throw new Error(result.error.message || "OTPメール送信に失敗しました");
  }
  console.log("[Resend OK] Sent OTP to", signerEmail, "id:", result.data?.id);
  return result;
}
