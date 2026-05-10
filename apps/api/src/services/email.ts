import nodemailer from "nodemailer";
import { logger } from "../lib/logger";
import { env } from "../config/env";

const SMTP_FROM = env.SMTP_FROM || "Onyx Propcare <noreply@onyxpropcare.com>";
const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

if (!isConfigured) {
  logger.warn("SMTP not configured. Emails will be logged but not sent.");
}

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;
let deliveryDisabled = false;

async function sendMail(to: string, subject: string, html: string) {
  if (!transporter || deliveryDisabled) {
    logger.info({ to, subject }, "[Email NoOp]");
    return;
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  } catch (err) {
    deliveryDisabled = true;
    logger.warn({ err }, "Email delivery disabled after SMTP failure");
  }
}

function layout(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#b8943f);color:#0a0a0a;font-weight:bold;font-size:20px;width:40px;height:40px;line-height:40px;border-radius:8px;transform:rotate(45deg);">
        <span style="display:inline-block;transform:rotate(-45deg);">O</span>
      </span>
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
