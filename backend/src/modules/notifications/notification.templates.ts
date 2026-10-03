export interface EmailTemplateParams {
  recipientName: string;
  weddingTitle: string;
  coupleTitle?: string;
  subject: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  details?: Array<{ label: string; value: string }>;
  shlokaVerse?: string;
}

export function generateRoyalEmailHtml(params: EmailTemplateParams): string {
  const {
    recipientName,
    weddingTitle,
    coupleTitle = 'Royal Vivaha',
    subject,
    message,
    actionText,
    actionUrl,
    details = [],
    shlokaVerse = '॥ ॐ श्री गणेशाय नमः ॥ मांगल्यं तन्तुनानेन लोकस्थितिहेतुना ॥',
  } = params;

  const detailsHtml =
    details.length > 0
      ? `
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; background: #FFFDF9; border: 1px solid #E9E1DD; border-radius: 12px; overflow: hidden;">
        <tbody>
          ${details
            .map(
              (d, idx) => `
            <tr style="border-bottom: ${idx === details.length - 1 ? 'none' : '1px solid #F4ECE8'};">
              <td style="padding: 12px 18px; font-size: 13px; font-weight: 600; color: #780616; text-transform: uppercase; letter-spacing: 0.05em; width: 40%; background: #FAF2EE;">
                ${d.label}
              </td>
              <td style="padding: 12px 18px; font-size: 14px; color: #1E1B19; font-weight: 500;">
                ${d.value}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
      : '';

  const ctaButtonHtml =
    actionText && actionUrl
      ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionUrl}" style="display: inline-block; background: #780616; color: #FAF7F2; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid #D4AF37; box-shadow: 0 4px 14px rgba(120,6,22,0.25);">
          ✦ ${actionText} ✦
        </a>
      </div>
    `
      : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #FAF7F2;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E9E1DD; box-shadow: 0 10px 30px rgba(0,0,0,0.04); overflow: hidden;">
          <!-- Palace Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #780616 0%, #4A0404 100%); padding: 36px 24px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <div style="font-size: 26px; line-height: 1; margin-bottom: 8px;">👑</div>
              <div style="color: #ECC071; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 6px;">
                MakeMyMarriage • Imperial Vivaha
              </div>
              <h1 style="color: #FAF7F2; font-size: 24px; font-family: Georgia, serif; font-weight: normal; margin: 0; letter-spacing: 0.02em;">
                ${coupleTitle}
              </h1>
              <div style="color: #FFDDDB; font-size: 12px; margin-top: 6px; letter-spacing: 0.05em;">
                ${weddingTitle}
              </div>
            </td>
          </tr>

          <!-- Sanskrit Verse -->
          <tr>
            <td style="background-color: #FAF2EE; padding: 12px 24px; text-align: center; border-bottom: 1px dashed #D3C4B3;">
              <span style="color: #7A5912; font-size: 12px; font-style: italic; letter-spacing: 0.03em;">
                ${shlokaVerse}
              </span>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <p style="font-size: 16px; color: #1E1B19; margin: 0 0 16px 0; font-weight: 600;">
                Namaste ${recipientName},
              </p>
              <div style="font-size: 15px; line-height: 1.6; color: #4F4538; margin: 0 0 20px 0; white-space: pre-line;">
                ${message}
              </div>

              ${detailsHtml}
              ${ctaButtonHtml}

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F4ECE8; font-size: 13px; color: #7F560C;">
                <strong>Vivaha Hospitality Concierge</strong><br>
                For ceremonial assistance, lake transfers, or dietary adjustments, please respond directly to this dispatch or consult the Royal Web Portal.
              </div>
            </td>
          </tr>

          <!-- Imperial Footer -->
          <tr>
            <td style="background-color: #1E1B19; padding: 24px; text-align: center; color: #827566; font-size: 11px; letter-spacing: 0.05em;">
              <div style="color: #D4AF37; font-weight: 700; margin-bottom: 4px;">✦ MAKEMYMARRIAGE ROYAL DISPATCH ENGINE ✦</div>
              <div>Cryptographically signed notification issued under sovereign mandate.</div>
              <div style="margin-top: 6px;">Udaipur • Jaipur • Rajasthan • Vivaha Suite 2026</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateRoyalEmailText(params: EmailTemplateParams): string {
  const {
    recipientName,
    weddingTitle,
    coupleTitle = 'Royal Vivaha',
    subject,
    message,
    actionText,
    actionUrl,
    details = [],
  } = params;

  let text = `👑 MAKEMYMARRIAGE ROYAL VIVAHA DISPATCH\n`;
  text += `${coupleTitle} — ${weddingTitle}\n\n`;
  text += `Namaste ${recipientName},\n\n`;
  text += `${message}\n\n`;

  if (details.length > 0) {
    text += `CEREMONIAL DETAILS:\n`;
    for (const d of details) {
      text += `• ${d.label}: ${d.value}\n`;
    }
    text += `\n`;
  }

  if (actionText && actionUrl) {
    text += `${actionText}: ${actionUrl}\n\n`;
  }

  text += `Vivaha Concierge • MakeMyMarriage Heritage Edition\n`;
  return text;
}

export interface WhatsAppTemplateParams {
  recipientName: string;
  weddingTitle: string;
  coupleTitle?: string;
  message: string;
  actionUrl?: string;
  details?: Array<{ label: string; value: string }>;
}

export function generateRoyalWhatsAppMessage(params: WhatsAppTemplateParams): string {
  const {
    recipientName,
    weddingTitle,
    coupleTitle = 'Royal Vivaha',
    message,
    actionUrl,
    details = [],
  } = params;

  let msg = `*👑 MAKEMYMARRIAGE ROYAL DISPATCH*\n`;
  msg += `*${coupleTitle}* | _${weddingTitle}_\n`;
  msg += `_॥ ॐ श्री गणेशाय नमः ॥_\n\n`;
  msg += `*Namaste ${recipientName} ji,*\n\n`;
  msg += `${message}\n\n`;

  if (details.length > 0) {
    msg += `*✨ CEREMONIAL BRIEF:*\n`;
    for (const d of details) {
      msg += `• *${d.label}:* ${d.value}\n`;
    }
    msg += `\n`;
  }

  if (actionUrl) {
    msg += `👉 *Access Your Royal Pass:* ${actionUrl}\n\n`;
  }

  msg += `_Warm regards,_\n`;
  msg += `*Vivaha Hospitality Concierge • MakeMyMarriage*`;
  return msg;
}
