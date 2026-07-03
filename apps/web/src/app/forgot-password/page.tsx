"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@onyx/ui";
import { Input } from "@onyx/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-onyx-950 p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.04)_0%,transparent_70%)]" />

      <motion.div
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        <motion.div custom={0} variants={fadeUp}>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-cream/68 hover:text-cream/70 transition-colors font-body text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </motion.div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-cream mb-3">
              Check Your Email
            </h2>
            <p className="text-cream/68 font-body mb-8">
              If an account exists with that email, a password reset link has been sent.
            </p>
            <Link href="/login">
              <Button className="w-full h-12">Return to Login</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div custom={1} variants={fadeUp}>
              <h2 className="font-display text-3xl font-semibold text-cream mb-2">
                Forgot Password
              </h2>
              <p className="text-cream/68 font-body mb-8">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div custom={2} variants={fadeUp}>
                <label className="block text-sm font-body text-cream/60 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </motion.div>

              <motion.div custom={3} variants={fadeUp}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-medium"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-onyx-950/30 border-t-onyx-950 rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </motion.div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
