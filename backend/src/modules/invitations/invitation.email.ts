/**
 * MakeMyMarriage — Royal HTML Email Template Generator
 * Produces responsive, luxury-themed wedding invitation emails.
 */

export interface InvitationEmailPayload {
  recipientName: string;
  recipientEmail: string;
  weddingTitle: string;
  coupleNames: string;
  venueName?: string;
  weddingDate?: string;
  magicUrl: string;
  paxCount: number;
  allocatedSuite?: string;
  shlokaVerse?: string;
}

export function generateInvitationEmailHtml(data: InvitationEmailPayload): string {
  const shloka =
    data.shlokaVerse ||
    'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Royal Wedding Invitation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #120a05;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e1b19;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: separate;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #120a05;
      padding: 30px 10px;
    }
    .main-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #faf6ee;
      border-radius: 20px;
      overflow: hidden;
      border: 2px solid #bf8e42;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .banner {
      background: linear-gradient(135deg, #8a1c36 0%, #4a0817 100%);
      padding: 40px 25px 30px;
      text-align: center;
      color: #faf6ee;
      border-bottom: 2px solid #bf8e42;
    }
    .gold-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 50px;
      background-color: rgba(191, 142, 66, 0.2);
      border: 1px solid #bf8e42;
      color: #f7d896;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .couple-title {
      font-size: 32px;
      font-weight: 800;
      margin: 10px 0 6px;
      letter-spacing: -0.5px;
      color: #ffffff;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .wedding-title {
      font-size: 14px;
      color: #f3cca0;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .shloka-box {
      margin-top: 20px;
      padding: 12px 18px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      border: 1px dashed rgba(247, 216, 150, 0.4);
      font-style: italic;
      font-size: 13px;
      color: #fce8cc;
      line-height: 1.5;
    }
    .content {
      padding: 35px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #1e1b19;
      margin-bottom: 10px;
    }
    .letter-body {
      font-size: 14px;
      line-height: 1.7;
      color: #53433e;
      margin-bottom: 25px;
    }
    .pass-details-box {
      background-color: #fdfaf4;
      border: 1px solid #e8dbca;
      border-radius: 14px;
      padding: 18px 22px;
      margin-bottom: 30px;
    }
    .pass-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid #f0e6d8;
    }
    .pass-row:last-child {
      border-bottom: none;
    }
    .pass-label {
      color: #85736e;
      font-weight: 500;
    }
    .pass-value {
      color: #8a1c36;
      font-weight: 700;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 20px;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #bf8e42 0%, #8c6320 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 15px rgba(191, 142, 66, 0.4);
      text-transform: uppercase;
    }
    .fallback-note {
      font-size: 11px;
      color: #85736e;
      text-align: center;
      margin-top: 15px;
      line-height: 1.5;
    }
    .fallback-link {
      color: #8a1c36;
      word-break: break-all;
    }
    .footer {
      background-color: #f2ebe1;
      padding: 20px 25px;
      text-align: center;
      font-size: 11px;
      color: #85736e;
      border-top: 1px solid #e8dbca;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main-card">
            <!-- Royal Banner -->
            <div class="banner">
              <div class="gold-badge">Shubh Vivah Aamantran</div>
              <h1 class="couple-title">${data.coupleNames}</h1>
              <p class="wedding-title">${data.weddingTitle} • Imperial Nuptials</p>
              <div class="shloka-box">"${shloka}"</div>
            </div>

            <!-- Content Area -->
            <div class="content">
              <div class="greeting">Namaste ${data.recipientName},</div>
              <div class="letter-body">
                By the divine grace of the Almighty and our respected ancestors, we cordially invite you and your esteemed household to grace the royal wedding celebrations.
                <br><br>
                Your unique cryptographic digital pass has been minted and secured with zero-password access. Kindly open your royal invitation below to view the ceremonial itinerary, venue directions, and confirm your RSVP.
              </div>

              <!-- Pass Summary Table -->
              <table width="100%" class="pass-details-box" cellpadding="6" cellspacing="0" border="0">
                <tr>
                  <td class="pass-label" width="40%">Dignitary Household:</td>
                  <td class="pass-value" align="right">${data.recipientName}</td>
                </tr>
                <tr>
                  <td class="pass-label">Allocated Presence:</td>
                  <td class="pass-value" align="right">${data.paxCount} Guests</td>
                </tr>
                <tr>
                  <td class="pass-label">Suite / Quarters:</td>
                  <td class="pass-value" align="right">${data.allocatedSuite || 'Palace Heritage Wing'}</td>
                </tr>
                <tr>
                  <td class="pass-label">Imperial Venue:</td>
                  <td class="pass-value" align="right">${data.venueName || 'The Leela Palace, Udaipur'}</td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div class="cta-container">
                <a href="${data.magicUrl}" target="_blank" class="cta-btn">
                  ✦ Unbox Royal Invitation & RSVP ✦
                </a>
              </div>

              <div class="fallback-note">
                If the button above does not open, copy and paste this secure link into your browser:
                <br>
                <a href="${data.magicUrl}" class="fallback-link">${data.magicUrl}</a>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              MakeMyMarriage Imperial Chancery • Secured by Zero-Password AES Encryption<br>
              This invitation pass is strictly personal to the recipient household.
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function generateInvitationEmailText(data: InvitationEmailPayload): string {
  return `✨ SHUBH VIVAH AAMANTRAN ✨\n\n` +
    `Namaste ${data.recipientName},\n\n` +
    `You and your esteemed family are cordially invited to celebrate the royal nuptials of ${data.coupleNames}.\n\n` +
    `Venue: ${data.venueName || 'The Leela Palace, Udaipur'}\n` +
    `Allocated Presence: ${data.paxCount} Guests (${data.allocatedSuite || 'Palace Wing'})\n\n` +
    `Kindly access your personalized digital invitation pass and confirm your RSVP here:\n` +
    `${data.magicUrl}\n\n` +
    `With royal regards,\nMakeMyMarriage Chancery`;
}
