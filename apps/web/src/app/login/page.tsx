"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@onyx/ui";
import { Input } from "@onyx/ui";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setGoogleRoleCookie = () => {
    document.cookie = "onyx-auth-role=BUYER; Path=/; Max-Age=600; SameSite=Lax";
  };

  const redirectAfterAuth = async () => {
    const session = await getSession();
    const role = session?.user?.role;
    router.push(
      role === "SELLER" || role === "AGENT" || role === "ADMIN" || role === "SUPER_ADMIN"
        ? "/dashboard"
        : "/"
    );
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        await redirectAfterAuth();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-onyx-950">
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />

        {/* Diagonal gold lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[200%] h-[200%] opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 80px, #C9A84C 80px, #C9A84C 81px)`,
            }}
          />
        </div>

        {/* Floating gold circles */}
        <motion.div
          animate={{ y: [-10, 10, -10], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-radial from-gold/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ y: [10, -10, 10], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-gradient-radial from-gold/15 to-transparent blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-gold rounded-lg rotate-45" />
                <span className="absolute inset-0 flex items-center justify-center font-display text-onyx-950 font-bold text-xl">
                  O
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-semibold tracking-wide text-cream">
                  ONYX
                </span>
                <span className="text-[10px] font-body uppercase tracking-[0.3em] text-gold/70 -mt-1">
                  Propcare
                </span>
              </div>
            </div>

            <h1 className="heading-lg text-cream mb-4">
              Welcome<br />
              <span className="text-gradient-gold">Back</span>
            </h1>
            <p className="text-cream/40 font-body text-lg max-w-md leading-relaxed">
              Sign in to access your premium land portfolio, track soil analytics,
              and manage your property investments.
            </p>
          </motion.div>

          {/* Decorative border line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="mt-12 h-px w-48 bg-gradient-to-r from-gold/50 to-transparent origin-left"
          />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 flex gap-12"
          >
            <div>
              <div className="font-display text-3xl text-gold font-semibold">12,500+</div>
              <div className="text-cream/30 text-sm font-body mt-1">Verified Listings</div>
            </div>
            <div>
              <div className="font-display text-3xl text-gold font-semibold">98%</div>
              <div className="text-cream/30 text-sm font-body mt-1">Clear Titles</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-onyx-950 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(201,168,76,0.03)_0%,transparent_70%)]" />

        <motion.div
          initial="hidden"
          animate="visible"
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <motion.div custom={0} variants={fadeUp} className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-gold rounded-lg rotate-45" />
              <span className="absolute inset-0 flex items-center justify-center font-display text-onyx-950 font-bold text-lg">
                O
              </span>
            </div>
            <span className="font-display text-xl font-semibold tracking-wide text-cream">
              ONYX
            </span>
          </motion.div>

          <motion.div custom={1} variants={fadeUp}>
            <h2 className="font-display text-3xl font-semibold text-cream mb-2">
              Sign In
            </h2>
            <p className="text-cream/40 font-body mb-8">
              Enter your credentials to access your account
            </p>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm font-body">{error}</p>
            </motion.div>
          )}

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
              <label className="block text-sm font-body text-cream/60 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-cream/20 bg-onyx-900/60 text-gold focus:ring-gold/30 focus:ring-2"
                />
                <span className="text-sm text-cream/40 font-body">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-gold/70 hover:text-gold transition-colors font-body"
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.div custom={5} variants={fadeUp}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-onyx-950/30 border-t-onyx-950 rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div custom={6} variants={fadeUp} className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-cream/10" />
            <span className="text-cream/25 text-xs font-body uppercase tracking-wider">
              or continue with
            </span>
            <div className="flex-1 h-px bg-cream/10" />
          </motion.div>

          {/* Google Sign In */}
          <motion.div custom={7} variants={fadeUp} className="mt-6">
            <button
              type="button"
              onClick={() => {
                setGoogleRoleCookie();
                signIn("google", { callbackUrl: "/auth/complete" });
              }}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg border border-cream/10 bg-onyx-900/40 hover:bg-onyx-900/70 hover:border-cream/20 transition-all duration-300 group"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-cream/60 group-hover:text-cream/80 font-body text-sm font-medium transition-colors">
                Sign in with Google
              </span>
            </button>
          </motion.div>

          <motion.div custom={8} variants={fadeUp} className="mt-6 text-center">
            <p className="text-cream/30 font-body text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-gold hover:text-gold-light transition-colors font-medium"
              >
                Create Account
              </Link>
            </p>
          </motion.div>

          {/* Decorative bottom border */}
          <motion.div
            custom={9}
            variants={fadeUp}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex-1 h-px bg-cream/5" />
            <span className="text-cream/20 text-xs font-body uppercase tracking-wider">
              Secure Login
            </span>
            <div className="flex-1 h-px bg-cream/5" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
