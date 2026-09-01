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
    // Check EMAIL_USER / SMTP_USER first, or USER only if it looks like an email address (to ignore Linux OS user like 'render'/'root')
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
          family: 4, // Force IPv4 to prevent ENETUNREACH on IPv4-only cloud hosts like Render
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
          family: 4, // Force IPv4 to prevent ENETUNREACH on IPv4-only cloud hosts like Render
        } as any);
      }
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;
    const from = process.env.EMAIL_FROM || this.defaultSender;

    if (!this.transporter) {
      console.log(`[Email Service Mock Dispatch] To: ${to} | Subject: ${subject}`);
      return true;
    }

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
