export function renderFollowUpHtml(
  data: {
    userName: string;
    messages: Array<{
      legislator_name: string;
      issue_area: string;
      created_at: string;
    }>;
    dashboardUrl: string;
  },
  unsubscribeUrl: string
): string {
  const messageRows = data.messages
    .map((m) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const timeLabel = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;">${m.legislator_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;">${m.issue_area}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#6b7280;">${timeLabel}</td>
        </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#374151;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#7c3aed;font-size:22px;margin:0;">My Democracy</h1>
    <p style="color:#6b7280;font-size:14px;margin:4px 0 0;">Follow-Up Reminder</p>
  </div>

  <p style="font-size:15px;">Hi ${data.userName},</p>
  <p style="font-size:14px;color:#4b5563;">
    You sent ${data.messages.length} message${data.messages.length > 1 ? 's' : ''} to your officials that ${data.messages.length > 1 ? "haven't" : "hasn't"} received a response yet.
    Following up can make a real difference — officials pay attention when constituents persist.
  </p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr style="background:#f5f3ff;">
      <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b21a8;">Official</th>
      <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b21a8;">Issue</th>
      <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b21a8;">Sent</th>
    </tr>
    ${messageRows}
  </table>

  <div style="text-align:center;margin:24px 0;">
    <a href="${data.dashboardUrl}" style="display:inline-block;padding:10px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;">
      Follow Up on Your Messages
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    You're receiving this because you opted in to follow-up reminders on My Democracy.<br>
    <a href="${unsubscribeUrl}" style="color:#7c3aed;">Unsubscribe</a>
  </p>
</body>
</html>`;
}
