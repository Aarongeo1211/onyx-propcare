import { Router, raw } from "express";
import { prisma } from "@onyx/db";
import { requireAuth } from "../middleware/auth";
import { sendSubscriptionConfirmation } from "../services/email";
import {
  getRazorpayPublicConfig,
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
  razorpayClient,
  verifyRazorpaySignature,
  verifyRazorpayWebhook,
} from "../services/razorpay";
import { logger } from "../lib/logger";
import { isProd } from "../config/env";

export const subscriptionRoutes = Router();

function getSubscriptionEndDate(listingDuration: number) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + listingDuration);
  return endDate;
}

async function activateSubscription(subscriptionId: string, paymentMeta?: { orderId: string; paymentId: string }) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, user: { select: { email: true } } },
  });
  if (!subscription) return null;

  const endDate = getSubscriptionEndDate(subscription.plan.listingDuration);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      ...(paymentMeta
        ? { razorpayOrderId: paymentMeta.orderId, razorpayPaymentId: paymentMeta.paymentId }
        : {}),
    },
    include: { plan: true },
  });

  if (subscription.user?.email) {
    sendSubscriptionConfirmation(subscription.user.email, updated.plan.name, endDate).catch((err) =>
      logger.error({ err }, "Failed to send subscription confirmation")
    );
  }

  return updated;
}

// POST /api/v1/subscriptions
subscriptionRoutes.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, error: "planId is required" });
    }

    if (!["SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        error: "Only seller accounts can purchase listing plans.",
      });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, error: "Plan not found or inactive" });
    }

    if (plan.type === "FREE") {
      const existingFree = await prisma.subscription.findFirst({
        where: { userId, planId: plan.id, status: "ACTIVE", endDate: { gt: new Date() } },
      });
      if (existingFree) {
        return res.status(400).json({ success: false, error: "Your free listing pack is already active." });
      }
    }

    // Free plans: activate immediately
    if (plan.price === 0) {
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "ACTIVE",
          amount: 0,
          propertiesUsed: 0,
          startDate: new Date(),
          endDate: getSubscriptionEndDate(plan.listingDuration),
        },
        include: { plan: true },
      });

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) {
        sendSubscriptionConfirmation(user.email, plan.name, subscription.endDate!).catch((err) =>
          logger.error({ err }, "Failed to send subscription confirmation")
        );
      }

      return res.status(201).json({
        success: true,
        data: subscription,
        payment: { mode: "free", ...getRazorpayPublicConfig() },
      });
    }

    // Paid plans require Razorpay configured — no silent mock activation
    if (!isRazorpayConfigured) {
      return res.status(503).json({
        success: false,
        error: "Payments are not configured. Please contact support.",
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "PAYMENT_PENDING",
        amount: plan.price,
        propertiesUsed: 0,
      },
      include: { plan: true },
    });

    const order = await razorpayClient!.orders.create({
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: `sub_${subscription.id}`,
      notes: {
        subscriptionId: subscription.id,
        planCode: plan.code,
        planCategory: plan.category,
      },
    });

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { razorpayOrderId: order.id, currency: order.currency },
      include: { plan: true },
    });

    res.status(201).json({
      success: true,
      data: updated,
      payment: {
        mode: "razorpay",
        ...getRazorpayPublicConfig(),
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (err) {
    logger.error({ err }, "Error creating subscription");
    res.status(500).json({ success: false, error: "Failed to create subscription" });
  }
});

// POST /api/v1/subscriptions/verify — client-side payment confirmation (still validated)
subscriptionRoutes.post("/verify", requireAuth, async (req, res) => {
  try {
    const { subscriptionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!subscriptionId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, error: "Missing payment verification fields" });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription || subscription.userId !== req.user!.id) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    if (subscription.status === "ACTIVE") {
      return res.json({ success: true, data: subscription });
    }

    if (!isRazorpayConfigured) {
      return res.status(503).json({ success: false, error: "Payments not configured" });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      logger.warn({ subscriptionId, userId: req.user!.id }, "Invalid Razorpay signature");
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    if (subscription.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, error: "Order mismatch" });
    }

    const activated = await activateSubscription(subscription.id, {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
    res.json({ success: true, data: activated });
  } catch (err) {
    logger.error({ err }, "Error verifying subscription payment");
    res.status(500).json({ success: false, error: "Failed to verify payment" });
  }
});

// POST /api/v1/subscriptions/webhook — Razorpay-initiated callback (raw body required)
// Mounted with express.raw at app level via dedicated path
subscriptionRoutes.post("/webhook", raw({ type: "application/json" }), async (req, res) => {
  try {
    if (!isRazorpayWebhookConfigured) {
      return res.status(503).json({ success: false, error: "Webhook not configured" });
    }

    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    if (!signature) {
      return res.status(400).json({ success: false, error: "Missing signature" });
    }

    const rawBody = (req.body as Buffer).toString("utf8");
    if (!verifyRazorpayWebhook(rawBody, signature)) {
      logger.warn("Invalid webhook signature");
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload: { payment: { entity: { id: string; order_id: string; status: string } } };
    };

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload.payment.entity;
      const subscription = await prisma.subscription.findFirst({
        where: { razorpayOrderId: payment.order_id },
      });

      if (subscription && subscription.status !== "ACTIVE") {
        await activateSubscription(subscription.id, {
          orderId: payment.order_id,
          paymentId: payment.id,
        });
        logger.info({ subscriptionId: subscription.id }, "Subscription activated via webhook");
      }
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Webhook processing error");
    res.status(500).json({ success: false, error: "Webhook error" });
  }
});

subscriptionRoutes.get("/my", requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user!.id, status: "ACTIVE", endDate: { gt: new Date() } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: subscription });
  } catch (err) {
    logger.error({ err }, "Error fetching subscription");
    res.status(500).json({ success: false, error: "Failed to fetch subscription" });
  }
});

subscriptionRoutes.get("/my/usage", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (subscriptions.length === 0) {
      return res.json({ success: true, data: null });
    }

    const latest = subscriptions[0];
    const hasUnlimitedProperties = subscriptions.some((s) => s.plan.maxProperties === -1);
    const hasUnlimitedImages = subscriptions.some((s) => s.plan.maxImages === -1);
    const maxVideos = Math.max(...subscriptions.map((s) => s.plan.maxVideos));
    const propertiesUsed = subscriptions.reduce((t, s) => t + s.propertiesUsed, 0);
    const maxProperties = hasUnlimitedProperties
      ? -1
      : subscriptions.reduce((t, s) => t + s.plan.maxProperties, 0);
    const maxImages = hasUnlimitedImages ? -1 : Math.max(...subscriptions.map((s) => s.plan.maxImages));
    const daysRemaining = Math.max(
      ...subscriptions.map((s) =>
        Math.max(0, Math.ceil((new Date(s.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      )
    );

    res.json({
      success: true,
      data: {
        propertiesUsed,
        maxProperties,
        maxImages,
        maxVideos,
        listingDuration: latest.plan.listingDuration,
        planType: latest.plan.type,
        planName: latest.plan.name,
        planCategory: latest.plan.category,
        daysRemaining,
        activePlans: subscriptions.map((s) => ({
          id: s.id,
          planId: s.planId,
          name: s.plan.name,
          code: s.plan.code,
          type: s.plan.type,
          category: s.plan.category,
          status: s.status,
          propertiesUsed: s.propertiesUsed,
          maxProperties: s.plan.maxProperties,
          maxImages: s.plan.maxImages,
          maxVideos: s.plan.maxVideos,
          endDate: s.endDate,
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, "Error fetching usage");
    res.status(500).json({ success: false, error: "Failed to fetch usage" });
  }
});

subscriptionRoutes.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const subscriptionId = String(req.params.id);
    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });

    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }
    if (subscription.userId !== userId) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }
    if (subscription.status === "CANCELLED") {
      return res.status(400).json({ success: false, error: "Already cancelled" });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
      include: { plan: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error({ err }, "Error cancelling subscription");
    res.status(500).json({ success: false, error: "Failed to cancel subscription" });
  }
});

// Suppress unused import warning
void isProd;
