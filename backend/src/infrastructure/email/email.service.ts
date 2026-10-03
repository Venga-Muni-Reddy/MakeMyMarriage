import nodemailer, { Transporter } from 'nodemailer';
import { resend } from '../resend/client';
import { config } from '../../config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  recipientName?: string;
}

export interface SendEmailResult {
  success: boolean;
  channel: 'RESEND' | 'SMTP' | 'SANDBOX_REDIRECT' | 'MOCK';
  messageId?: string;
  deliveredTo: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let lastSmtpConfig = '';

const getSmtpTransporter = () => {
  const user = (process.env.SMTP_USER || config.smtp.user || '').trim();
  const rawPass = (process.env.SMTP_PASS || config.smtp.pass || '').trim();
  const pass = rawPass.replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || config.smtp.host || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || String(config.smtp.port) || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || config.smtp.secure;

  if (!user || !pass) {
    return null;
  }

  const currentConfigKey = `${user}:${pass}:${host}:${port}:${secure}`;
  if (cachedTransporter && lastSmtpConfig === currentConfigKey) {
    return cachedTransporter;
  }

  const transportOptions: any = host.toLowerCase().includes('gmail')
    ? {
        service: 'gmail',
        auth: { user, pass },
      }
    : {
        host,
        port,
        secure,
        auth: { user, pass },
      };

  cachedTransporter = nodemailer.createTransport(transportOptions);
  lastSmtpConfig = currentConfigKey;
  return cachedTransporter;
};

export const emailService = {
  /**
   * HIGH PRIORITY: Dispatches directly via SMTP whenever SMTP credentials exist.
   * This sends real emails to ANY targeted recipient with 0 restrictions!
   * Falls back to Resend only if SMTP credentials are missing or SMTP connection fails.
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, html, text, from, recipientName } = options;

    const smtpUser = (process.env.SMTP_USER || config.smtp.user || '').trim();
    const smtpFrom = process.env.SMTP_FROM || config.smtp.from || (smtpUser ? `MakeMyMarriage <${smtpUser}>` : undefined);
    const transporter = getSmtpTransporter();

    // =========================================================================
    // 1. HIGHEST PRIORITY: SMTP (Direct to ANY target email address)
    // =========================================================================
    if (transporter && smtpUser) {
      try {
        const fromAddress = from || smtpFrom || `MakeMyMarriage <${smtpUser}>`;
        console.log(`[EMAIL DISPATCH: SMTP PRIORITY] Sending to target recipient: ${to} via ${smtpUser}...`);

        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          text: text || '',
        });

        console.log(`[EMAIL DISPATCH: SMTP SUCCESS] Successfully delivered to ${to} (MessageId: ${info.messageId})`);
        return {
          success: true,
          channel: 'SMTP',
          messageId: info.messageId,
          deliveredTo: to,
        };
      } catch (smtpErr: any) {
        console.error('[EMAIL SMTP ERROR] Failed sending via SMTP:', smtpErr.message);
        console.log('[EMAIL FALLBACK] Attempting fallback to Resend...');
      }
    }

    // =========================================================================
    // 2. SECONDARY FALLBACK: Resend (Subject to Resend domain/sandbox policies)
    // =========================================================================
    if (resend) {
      const fromAddress = from || config.resend.emailFrom || 'MakeMyMarriage <onboarding@resend.dev>';
      const isResendSandbox = fromAddress.includes('resend.dev');
      const devOverride = process.env.RESEND_DEV_OVERRIDE_EMAIL || 'vengamunireddy040404@gmail.com';
      const isRedirected = isResendSandbox && to.toLowerCase() !== devOverride.toLowerCase();
      const targetEmail = isResendSandbox ? devOverride : to;

      const finalSubject = isRedirected
        ? `[Preview for ${recipientName || to}] ${subject}`
        : subject;

      try {
        console.log(`[EMAIL DISPATCH: RESEND] Sending to ${targetEmail} (Original recipient: ${to})...`);
        const res = await resend.emails.send({
          from: fromAddress,
          to: targetEmail,
          subject: finalSubject,
          html,
          text: text || '',
        });

        if (res.error) {
          throw new Error(res.error.message);
        }

        console.log(`[EMAIL RESEND SUCCESS] Delivered to ${targetEmail} (Redirected: ${isRedirected})`);
        return {
          success: true,
          channel: isRedirected ? 'SANDBOX_REDIRECT' : 'RESEND',
          messageId: res.data?.id,
          deliveredTo: targetEmail,
        };
      } catch (resendErr: any) {
        console.error('[EMAIL RESEND ERROR] Failed sending via Resend:', resendErr.message);
        return {
          success: false,
          channel: 'RESEND',
          deliveredTo: to,
          error: resendErr.message || 'Resend delivery failed',
        };
      }
    }

    // =========================================================================
    // 3. DEVELOPMENT LOGGING (If neither SMTP nor Resend are configured)
    // =========================================================================
    console.log(`[EMAIL MOCK DISPATCH] To: ${to} | Subject: ${subject}`);
    return {
      success: true,
      channel: 'MOCK',
      deliveredTo: to,
    };
  },
};
