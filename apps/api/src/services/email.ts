import nodemailer from "nodemailer";
import { Resend } from "resend";
import { logger } from "../lib/logger";
import { env } from "../config/env";

const EMAIL_FROM = env.SMTP_FROM || "Onyx Propcare <contact@onyxpropcare.com>";

// ─── Resend (preferred on Railway — uses HTTPS, no SMTP port blocking) ────────
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// ─── Nodemailer SMTP (fallback for local/self-hosted) ─────────────────────────
const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
    })
  : null;

if (!resend && !transporter) {
  logger.warn("No email provider configured (set RESEND_API_KEY or SMTP_* vars). Emails will be logged only.");
} else {
  logger.info({ provider: resend ? "resend" : "smtp" }, "Email provider initialized");
}

async function sendMail(to: string, subject: string, html: string) {
  // 1. Try Resend (HTTPS — works on Railway)
  if (resend) {
    const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
    if (error) {
      logger.error({ error, to, subject }, "Resend email failed");
    } else {
      logger.info({ to, subject }, "Email sent via Resend");
    }
    return;
  }

  // 2. Fall back to SMTP (nodemailer)
  if (transporter) {
    try {
      await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
      logger.info({ to, subject }, "Email sent via SMTP");
    } catch (err) {
      logger.error({ err, to, subject }, "SMTP email failed");
    }
    return;
  }

  // 3. No provider — log only
  logger.info({ to, subject }, "[Email NoOp] no provider configured");
}

function layout(title: string, body: string) {
  const logoUrl = `${env.APP_URL}/icon.png`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="${logoUrl}" alt="Onyx Propcare" width="72" height="72" style="display:inline-block;border-radius:12px;" />
      <div style="color:#f5f0e8;font-size:18px;font-weight:600;letter-spacing:2px;margin-top:8px;">ONYX PROPCARE</div>
    </div>
    <div style="background:#141414;border:1px solid #222;border-radius:12px;padding:32px;">
      <h1 style="color:#C9A84C;font-size:22px;margin:0 0 20px 0;">${title}</h1>
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:#555;font-size:12px;">
      &copy; ${new Date().getFullYear()} Onyx Propcare. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

const textStyle = 'style="color:#d4d4d4;font-size:15px;line-height:1.6;margin:0 0 16px 0;"';
const btnStyle = 'style="display:inline-block;background:#C9A84C;color:#0a0a0a;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;"';
const labelStyle = 'style="color:#888;font-size:13px;margin:0 0 2px 0;"';
const valueStyle = 'style="color:#f5f0e8;font-size:15px;margin:0 0 12px 0;"';

export async function sendInquiryNotification(
  to: string,
  propertyTitle: string,
  buyerName: string,
  buyerEmail: string,
  message: string
) {
  const html = layout(
    "New Inquiry Received",
    `<p ${textStyle}>You have a new inquiry on your property listing.</p>
     <p ${labelStyle}>Property</p>
     <p ${valueStyle}>${propertyTitle}</p>
     <p ${labelStyle}>From</p>
     <p ${valueStyle}>${buyerName} (${buyerEmail})</p>
     <p ${labelStyle}>Message</p>
     <p ${valueStyle}>${message}</p>`
  );
  await sendMail(to, `New Inquiry: ${propertyTitle}`, html);
}

export async function sendSubscriptionConfirmation(
  to: string,
  planName: string,
  expiresAt: Date
) {
  const html = layout(
    "Subscription Confirmed",
    `<p ${textStyle}>Your subscription has been activated successfully.</p>
     <p ${labelStyle}>Plan</p>
     <p ${valueStyle}>${planName}</p>
     <p ${labelStyle}>Valid Until</p>
     <p ${valueStyle}>${expiresAt.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
     <p ${textStyle}>You can now start listing your properties.</p>`
  );
  await sendMail(to, `Subscription Confirmed: ${planName}`, html);
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  resetUrl: string
) {
  const link = `${resetUrl}?token=${resetToken}`;
  const html = layout(
    "Reset Your Password",
    `<p ${textStyle}>We received a request to reset your password. Click the button below to set a new password.</p>
     <div style="text-align:center;margin:28px 0;">
       <a href="${link}" ${btnStyle}>Reset Password</a>
     </div>
     <p style="color:#888;font-size:13px;margin:0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`
  );
  await sendMail(to, "Reset Your Password - Onyx Propcare", html);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = layout(
    "Welcome to Onyx Propcare",
    `<p ${textStyle}>Hi ${name},</p>
     <p ${textStyle}>Thank you for joining Onyx Propcare. We're excited to help you find the perfect property or connect with qualified buyers.</p>
     <p ${textStyle}>Get started by browsing verified listings or creating your first property listing.</p>`
  );
  await sendMail(to, "Welcome to Onyx Propcare", html);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
) {
  const html = layout(
    "Verify Your Email Address",
    `<p ${textStyle}>Hi ${name},</p>
     <p ${textStyle}>Thanks for signing up! Please verify your email address to unlock all features, including listing properties for sale or rent.</p>
     <div style="text-align:center;margin:28px 0;">
       <a href="${verifyUrl}" ${btnStyle}>Verify Email Address</a>
     </div>
     <p style="color:#888;font-size:13px;margin:0 0 8px 0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
     <p style="color:#555;font-size:12px;margin:0;">Or copy this link into your browser:<br/><span style="color:#C9A84C;word-break:break-all;">${verifyUrl}</span></p>`
  );
  await sendMail(to, "Verify your email – Onyx Propcare", html);
}
