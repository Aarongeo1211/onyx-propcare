"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, RefreshCw, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@onyx/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function PendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (resending || resent || !email) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to resend. Please try again.");
      } else {
        setResent(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-onyx-900/60 border border-cream/10 rounded-2xl p-10 text-center backdrop-blur-sm">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Mail className="w-9 h-9 text-gold" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border border-gold/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <h1 className="font-display text-2xl font-semibold text-cream mb-3">
        Check your inbox
      </h1>
      <p className="text-cream/78 font-body text-sm leading-relaxed mb-2">
        We&apos;ve sent a verification link to{" "}
        {email ? <strong className="text-cream/88">{email}</strong> : "your email address"}.
      </p>
      <p className="text-cream/82 font-body text-xs mb-8">
        Click the link in the email to activate your account. The link expires in 24 hours.
      </p>

      {/* Resent success */}
      {resent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm font-body">Verification email resent!</p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-red-400 text-sm font-body">{error}</p>
        </motion.div>
      )}

      {/* Resend button */}
      {!resent && email && (
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resending}
          className="w-full mb-4"
        >
          {resending ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sending...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Resend verification email
            </div>
          )}
        </Button>
      )}

      <div className="h-px bg-cream/5 my-5" />

      <div className="flex flex-col gap-3 text-sm">
        <p className="text-cream/82 font-body text-xs">
          Didn&apos;t receive it? Check your spam folder or try resending.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 text-cream/86 hover:text-cream/88 transition-colors font-body text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-onyx-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.06)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        <Suspense
          fallback={
            <div className="bg-onyx-900/60 border border-cream/10 rounded-2xl p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Loader2 className="w-9 h-9 text-gold animate-spin" />
                </div>
              </div>
              <p className="text-cream/86 font-body text-sm">Loading...</p>
            </div>
          }
        >
          <PendingContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
