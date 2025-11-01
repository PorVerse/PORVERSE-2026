// lib/email/templates/stripeReceipt.ts
type ReceiptInput = {
  title: string
  intro: string
  planLabel: string
  amountLabel: string
  amount: string // ex: "€19.00"
  nextSteps?: string[]
  footerNote?: string
}

export function stripeReceiptTemplate({
  title,
  intro,
  planLabel,
  amountLabel,
  amount,
  nextSteps = [],
  footerNote,
}: ReceiptInput) {
  const steps = nextSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#111214;border:1px solid #232428;border-radius:12px;padding:28px;">
            <tr>
              <td>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;font-weight:700;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 16px;color:#bbb">${escapeHtml(intro)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background:#0f1013;border:1px solid #232428;border-radius:10px;">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #232428;">
                      <strong>${escapeHtml(planLabel)}</strong>
                    </td>
                    <td style="padding:14px 16px;border-bottom:1px solid #232428;" align="right">
                      <strong>${escapeHtml(amount)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;color:#aaa">${escapeHtml(amountLabel)}</td>
                    <td style="padding:14px 16px;color:#aaa" align="right">${escapeHtml(amount)}</td>
                  </tr>
                </table>
                ${
                  steps
                    ? `<div style="margin:18px 0;">
                        <p style="margin:0 0 8px;color:#bbb"><strong>Next steps</strong></p>
                        <ol style="margin:0 0 6px 18px;color:#bbb">${steps}</ol>
                      </div>`
                    : ''
                }
                ${
                  footerNote
                    ? `<p style="margin:16px 0 0;color:#6f7380;font-size:12px;">${escapeHtml(footerNote)}</p>`
                    : ''
                }
              </td>
            </tr>
          </table>
          <p style="color:#666;margin:10px 0 0;font-size:12px;">© ${new Date().getFullYear()} PorVerse</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m] as string))
}
