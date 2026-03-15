import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

/**
 * Cron endpoint: Check for expiring contracts and send alerts.
 * Should be called daily via Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find documents with contract_end_date within the next 30 days or already expired
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: expiringDocs, error } = await admin
    .from("documents")
    .select("id, title, owner_id, contract_end_date, reminder_days_before, status")
    .eq("status", "completed")
    .not("contract_end_date", "is", null)
    .lte("contract_end_date", thirtyDaysFromNow.toISOString().split("T")[0])
    .gte("contract_end_date", new Date().toISOString().split("T")[0]);

  if (error) {
    console.error("[Cron] Error fetching expiring docs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expiringDocs || expiringDocs.length === 0) {
    return NextResponse.json({ sent: 0, message: "No expiring contracts" });
  }

  // Group by owner
  const ownerDocs: Record<string, typeof expiringDocs> = {};
  for (const doc of expiringDocs) {
    if (!ownerDocs[doc.owner_id]) ownerDocs[doc.owner_id] = [];
    ownerDocs[doc.owner_id].push(doc);
  }

  // Get owner emails
  let sentCount = 0;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const fromAddress = (process.env.EMAIL_FROM ?? "MUSUBI sign <noreply@sign.unser-inc.com>").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const [ownerId, docs] of Object.entries(ownerDocs)) {
    // Get owner email from auth
    const { data: { user } } = await admin.auth.admin.getUserById(ownerId);
    if (!user?.email) continue;

    const today = new Date();
    const alerts = docs.map((d) => {
      const endDate = new Date(d.contract_end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...d, daysRemaining };
    }).filter((d) => {
      // Only send if within the reminder window
      const reminderDays = d.reminder_days_before ?? 30;
      return d.daysRemaining <= reminderDays;
    });

    if (alerts.length === 0) continue;

    const alertRows = alerts.map((a) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">
          <a href="${appUrl}/documents/${a.id}" style="color: #1f2937; text-decoration: none; font-weight: 500;">${a.title}</a>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">
          ${new Date(a.contract_end_date).toLocaleDateString("ja-JP")}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">
          <span style="color: ${a.daysRemaining <= 7 ? '#ef4444' : a.daysRemaining <= 14 ? '#f59e0b' : '#3b82f6'}; font-weight: bold;">
            ${a.daysRemaining}日
          </span>
        </td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="width: 32px; height: 32px; background: linear-gradient(135deg, #1a365d, #312e81); border-radius: 8px; text-align: center; vertical-align: middle;">
                <span style="color: white; font-weight: bold; font-size: 14px; line-height: 32px;">M</span>
              </td>
              <td style="padding-left: 10px; vertical-align: middle;">
                <span style="font-size: 18px; font-weight: bold; color: #1f2937;">MUSUBI sign</span>
              </td>
            </tr>
          </table>
        </div>
        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">${alerts.length}件の契約が期限間近です</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280;">契約名</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #6b7280;">期限日</th>
              <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #6b7280;">残り</th>
            </tr>
          </thead>
          <tbody>
            ${alertRows}
          </tbody>
        </table>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${appUrl}/documents" style="display: inline-block; background: linear-gradient(135deg, #1a365d, #312e81); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            ダッシュボードで確認
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
          このメールは MUSUBI sign から自動送信されています。
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: fromAddress,
        to: user.email,
        subject: `【契約期限通知】${alerts.length}件の契約が期限間近です`,
        html,
      });
      sentCount++;
    } catch (err) {
      console.error(`[Cron] Failed to send alert to ${user.email}:`, err);
    }
  }

  return NextResponse.json({
    sent: sentCount,
    totalExpiring: expiringDocs.length,
  });
}
