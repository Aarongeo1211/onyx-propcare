import { logger } from "../lib/logger";

// No SMS/WhatsApp provider is wired up yet (no Twilio/MSG91/WhatsApp Business
// account exists for this project). These stubs exist so call sites (seller
// notifications on new inquiries/callbacks) are already in place -- wiring up
// a real provider later is just filling in the body below, not touching
// every route that wants to notify someone.
export async function sendSmsNotification(to: string, message: string) {
  logger.info({ to, message }, "[SMS NoOp] no provider configured -- would send SMS");
}

export async function sendWhatsAppNotification(to: string, message: string) {
  logger.info({ to, message }, "[WhatsApp NoOp] no provider configured -- would send WhatsApp message");
}
