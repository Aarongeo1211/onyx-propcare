import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "@onyx/db";
import { requireAuth, JWT_SECRET } from "../middleware/auth";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/email";
import { isLocked, recordFailure, clearFailures } from "../middleware/loginAttempts";
import { verifyGoogleIdToken, isGoogleConfigured } from "../services/google";
import { logger } from "../lib/logger";
import { env } from "../config/env";

export const authRoutes = Router();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number");

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().nullable(),
  password: passwordSchema,
  role: z.enum(["BUYER", "SELLER", "AGENT"]).default("BUYER"),
});

function signToken(user: { id: string; email: string; name: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

authRoutes.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: "An account with this email already exists" });
    }

    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingPhone) {
        return res.status(409).json({ success: false, error: "An account with this phone number already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: data.role,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, createdAt: true },
    });

    sendWelcomeEmail(user.email, user.name).catch((err) => logger.error({ err }, "welcome email failed"));
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    logger.error({ err }, "Registration error");
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

authRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const lockStatus = isLocked(email);
    if (lockStatus.locked) {
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked. Try again in ${lockStatus.retryAfterSec}s.`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });

    if (!user || !user.passwordHash) {
      recordFailure(email);
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Account is deactivated" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      recordFailure(email);
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    clearFailures(email);
    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, name: user.name, email: user.email,
          phone: user.phone, role: user.role, avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

// POST /api/v1/auth/google — accepts Google ID token, verifies with Google
authRoutes.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: "idToken is required" });
    }

    if (!isGoogleConfigured) {
      return res.status(503).json({ success: false, error: "Google sign-in not configured" });
    }

    const profile = await verifyGoogleIdToken(idToken);
    if (!profile || !profile.emailVerified) {
      return res.status(401).json({ success: false, error: "Invalid or unverified Google token" });
    }

    let user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email.toLowerCase(),
          avatar: profile.picture || null,
          role: "BUYER",
          emailVerified: new Date(),
          isActive: true,
        },
      });
    } else if (!user.avatar && profile.picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: profile.picture, emailVerified: user.emailVerified || new Date() },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Account is deactivated" });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id, name: user.name, email: user.email,
          phone: user.phone, role: user.role, avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "Google auth error");
    res.status(500).json({ success: false, error: "Google authentication failed" });
  }
});

authRoutes.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, isActive: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error({ err }, "Fetch user error");
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

authRoutes.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: tokenHash, resetTokenExpiry },
      });

      await sendPasswordResetEmail(user.email, rawToken, `${env.APP_URL}/reset-password`).catch((err) =>
        logger.error({ err }, "Reset email failed")
      );
    }

    res.json({ success: true, message: "If an account exists, a reset link has been sent" });
  } catch (err) {
    logger.error({ err }, "Forgot password error");
    res.status(500).json({ success: false, error: "Failed to process request" });
  }
});

authRoutes.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: "Token and new password are required" });
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors[0].message });
      }
      throw err;
    }

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await prisma.user.findFirst({
      where: { resetToken: tokenHash, resetTokenExpiry: { gt: new Date() } },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ success: true, message: "Password has been reset successfully" });
  } catch (err) {
    logger.error({ err }, "Reset password error");
    res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

// POST /api/v1/auth/change-password — for logged-in users
authRoutes.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Current and new passwords required" });
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: err.errors[0].message });
      }
      throw err;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: "Password change unavailable for this account",
      });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    logger.error({ err }, "Change password error");
    res.status(500).json({ success: false, error: "Failed to change password" });
  }
});
