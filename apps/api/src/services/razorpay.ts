import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env";

const keyId = env.RAZORPAY_KEY_ID;
const keySecret = env.RAZORPAY_KEY_SECRET;
const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

export const isRazorpayConfigured = Boolean(keyId && keySecret);
export const isRazorpayWebhookConfigured = Boolean(webhookSecret);

export const razorpayClient = isRazorpayConfigured
  ? new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    })
  : null;

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (!keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string) {
  if (!webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

export function getRazorpayPublicConfig() {
  return {
    keyId: keyId || null,
    enabled: isRazorpayConfigured,
  };
}
