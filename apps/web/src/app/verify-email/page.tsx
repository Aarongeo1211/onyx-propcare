"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@onyx/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please use the link from your email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.error || "This verification link is invalid or has expired.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred while verifying your email. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-onyx-900/60 border border-cream/10 rounded-2xl p-10 text-center backdrop-blur-sm">
      {/* Loading state */}
      {status === "loading" && (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Loader2 className="w-9 h-9 text-gold animate-spin" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-cream mb-3">
            Verifying your email…
          </h1>
          <p className="text-cream/68 font-body text-sm">
            Please wait while we confirm your email address.
          </p>
        </>
      )}

      {/* Success state */}
      {status === "success" && (
        <>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-400" />
            </div>
          </motion.div>
          <h1 className="font-display text-2xl font-semibold text-cream mb-3">
            Email verified!
          </h1>
          <p className="text-cream/50 font-body text-sm leading-relaxed mb-8">
            {message} You can now access all features including listing properties.
          </p>
          <div className="flex flex-col gap-3">
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              <div className="flex items-center gap-2">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </div>
            </Button>
            <Link
              href="/"
              className="text-cream/62 hover:text-cream/60 transition-colors font-body text-sm"
            >
              Browse properties
            </Link>
          </div>
        </>
      )}

      {/* Error state */}
      {status === "error" && (
        <>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-400" />
            </div>
          </motion.div>
          <h1 className="font-display text-2xl font-semibold text-cream mb-3">
            Verification failed
          </h1>
          <p className="text-cream/50 font-body text-sm leading-relaxed mb-8">
            {message}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full">Sign in to resend verification</Button>
            </Link>
            <Link
              href="/"
              className="text-cream/62 hover:text-cream/60 transition-colors font-body text-sm"
            >
              Go to homepage
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
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
              <p className="text-cream/68 font-body text-sm">Loading…</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
