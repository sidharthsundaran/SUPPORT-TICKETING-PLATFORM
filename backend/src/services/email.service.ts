import "dotenv/config";
import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private defaultSender: string = '"Support Platform" <no-reply@supportplatform.dev>';

  constructor() {
    const user =
      process.env.EMAIL_USER ||
      process.env.SMTP_USER ||
      process.env.MAIL_USER ||
      (process.env.USER && process.env.USER.includes("@") ? process.env.USER : undefined);

    const pass =
      process.env.EMAIL_PASS ||
      process.env.SMTP_PASS ||
      process.env.MAIL_PASS ||
      process.env.PASS;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 465;

    if (user && pass) {
      this.defaultSender = user;
      if (process.env.EMAIL_SERVICE === "gmail" || !host || host === "smtp.gmail.com") {
        this.transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user,
            pass,
          },
          family: 4,
        } as any);
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
          family: 4,
        } as any);
      }
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    // 1. Send via Brevo REST API (HTTPS Port 443 - Works on Render, sends to ANY recipient without domain DNS)
    if (brevoApiKey) {
      const senderEmail =
        process.env.BREVO_SENDER_EMAIL ||
        process.env.EMAIL_USER ||
        "lucidlayers079@gmail.com";
      const senderName = process.env.BREVO_SENDER_NAME || "Support Platform";

      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey.trim(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: senderName,
              email: senderEmail,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text || subject,
          }),
        });

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({ message: response.statusText }));
          const errorMessage = errorData?.message || JSON.stringify(errorData);
          console.error(`[Brevo Error] Failed to send email to ${to}: ${errorMessage}`);
          throw new Error(`Brevo Error: ${errorMessage}`);
        }

        console.log(`[Brevo Success] Email delivered to ${to} | Subject: ${subject}`);
        return true;
      } catch (err: any) {
        console.error(`[Email Service Error] Failed via Brevo to ${to}:`, err?.message || err);
        throw err;
      }
    }

    // 2. Send via Resend REST API (HTTPS Port 443)
    if (resendApiKey) {
      const from =
        process.env.RESEND_FROM ||
        process.env.EMAIL_FROM ||
        "Support Platform <onboarding@resend.dev>";

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
            text: text || subject,
          }),
        });

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({ message: response.statusText }));
          const errorMessage = errorData?.message || errorData?.name || JSON.stringify(errorData);
          console.error(`[Resend Error] Failed to send email to ${to}: ${errorMessage}`);
          throw new Error(`Resend Error: ${errorMessage}`);
        }

        console.log(`[Resend Success] Email delivered to ${to} | Subject: ${subject}`);
        return true;
      } catch (err: any) {
        console.error(`[Email Service Error] Failed via Resend to ${to}:`, err?.message || err);
        throw err;
      }
    }

    // 3. Fallback to Nodemailer SMTP
    if (this.transporter) {
      const from = process.env.EMAIL_FROM || this.defaultSender;
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
          text: text || subject,
        });
        return true;
      } catch (err: any) {
        console.error(`[Email Service Error] Failed to send email to ${to}:`, err?.message || err);
        throw err;
      }
    }

    // 4. Fallback to Mock Dispatch
    console.log(`[Email Service Mock Dispatch] To: ${to} | Subject: ${subject}`);
    return true;
  }

  renderHtmlTemplate(title: string, contentHtml: string, actionUrl?: string, actionText?: string): string {
    const brandName = process.env.PLATFORM_NAME || "Support Ticketing Platform";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { background: #4f46e5; color: #ffffff; padding: 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
            .body { padding: 24px; line-height: 1.6; font-size: 14px; }
            .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 16px; font-size: 14px; }
            .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>${brandName}</h1>
            </div>
            <div class="body">
              <h2 style="margin-top:0; font-size:16px; color:#0f172a;">${title}</h2>
              <div>${contentHtml}</div>
              ${actionUrl ? `<div style="text-align: center; margin-top: 24px;"><a href="${actionUrl}" class="btn">${actionText || "View Ticket"}</a></div>` : ""}
            </div>
            <div class="footer">
              <p style="margin: 0;">This is an automated notification from ${brandName}.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
