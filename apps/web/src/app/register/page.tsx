"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  Building2,
  Check,
} from "lucide-react";
import { Button } from "@onyx/ui";
import { Input } from "@onyx/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_ROLE_COOKIE = "onyx-auth-role";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "BUYER" as "BUYER" | "SELLER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const redirectAfterAuth = async () => {
    const session = await getSession();
    const role = session?.user?.role;
    window.location.assign(
      role === "SELLER" || role === "AGENT" || role === "ADMIN" || role === "SUPER_ADMIN"
        ? "/dashboard"
        : "/"
    );
  };

  const setGoogleRoleCookie = (role: "BUYER" | "SELLER") => {
    document.cookie = `${GOOGLE_ROLE_COOKIE}=${role}; Path=/; Max-Age=600; SameSite=Lax`;
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Invalid email format";
    if (form.phone && !/^[\d+\-() ]{7,15}$/.test(form.phone))
      errors.phone = "Invalid phone number";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6)
      errors.password = "Must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      // Register via API
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after registration so the user has a session for the resend button
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      // Always redirect to email verification pending page
      window.location.assign("/verify-email/pending");
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
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />

        {/* Diagonal gold lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-[200%] h-[200%] opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 60px, #C9A84C 60px, #C9A84C 61px)`,
            }}
          />
        </div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [-15, 15, -15], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-gradient-radial from-gold/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ y: [10, -15, 10], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/3 w-56 h-56 rounded-full bg-gradient-radial from-gold/15 to-transparent blur-3xl"
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
              Begin Your<br />
              <span className="text-gradient-gold">Journey</span>
            </h1>
            <p className="text-cream/40 font-body text-lg max-w-md leading-relaxed">
              Join thousands of investors and landowners on India&apos;s most
              trusted farmland and plot marketplace.
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="mt-12 h-px w-48 bg-gradient-to-r from-gold/50 to-transparent origin-left"
          />

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 space-y-4"
          >
            {[
              "AI-powered soil & water analytics",
              "Legal verification on every plot",
              "Drone-mapped property boundaries",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Check className="w-3 h-3 text-gold" />
                </div>
                <span className="text-cream/40 text-sm font-body">{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-onyx-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(201,168,76,0.03)_0%,transparent_70%)]" />

        <motion.div
          initial="hidden"
          animate="visible"
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <motion.div
            custom={0}
            variants={fadeUp}
            className="lg:hidden flex items-center gap-3 mb-8 justify-center"
          >
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
              Create Account
            </h2>
            <p className="text-cream/40 font-body mb-8">
              Start your property investment journey today
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <motion.div custom={2} variants={fadeUp}>
              <label className="block text-sm font-body text-cream/60 mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm("role", "BUYER")}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-300 ${
                    form.role === "BUYER"
                      ? "border-gold/50 bg-gold/5 text-gold"
                      : "border-cream/10 bg-onyx-900/40 text-cream/40 hover:border-cream/20"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-sm font-body font-medium">Buy Land</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm("role", "SELLER")}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-300 ${
                    form.role === "SELLER"
                      ? "border-gold/50 bg-gold/5 text-gold"
                      : "border-cream/10 bg-onyx-900/40 text-cream/40 hover:border-cream/20"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm font-body font-medium">Sell Land</span>
                </button>
              </div>
            </motion.div>

            {/* Name */}
            <motion.div custom={3} variants={fadeUp}>
              <label className="block text-sm font-body text-cream/60 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
                autoComplete="name"
              />
              {fieldErrors.name && (
                <p className="text-red-400 text-xs mt-1 font-body">{fieldErrors.name}</p>
              )}
            </motion.div>

            {/* Email */}
            <motion.div custom={4} variants={fadeUp}>
              <label className="block text-sm font-body text-cream/60 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1 font-body">{fieldErrors.email}</p>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div custom={5} variants={fadeUp}>
              <label className="block text-sm font-body text-cream/60 mb-2">
                Phone Number{" "}
                <span className="text-cream/20">(optional)</span>
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                autoComplete="tel"
              />
              {fieldErrors.phone && (
                <p className="text-red-400 text-xs mt-1 font-body">{fieldErrors.phone}</p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div custom={6} variants={fadeUp}>
              <label className="block text-sm font-body text-cream/60 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1 font-body">{fieldErrors.password}</p>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div custom={7} variants={fadeUp}>
              <label className="block text-sm font-body text-cream/60 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
                required
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 font-body">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </motion.div>

            <motion.div custom={8} variants={fadeUp}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-medium mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-onyx-950/30 border-t-onyx-950 rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div custom={9} variants={fadeUp} className="mt-5 flex items-center gap-4">
            <div className="flex-1 h-px bg-cream/10" />
            <span className="text-cream/25 text-xs font-body uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-cream/10" />
          </motion.div>

          {/* Google Sign Up */}
          <motion.div custom={10} variants={fadeUp} className="mt-5">
            <button
              type="button"
              onClick={() => {
                setGoogleRoleCookie(form.role);
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
                Sign up with Google
              </span>
            </button>
          </motion.div>

          <motion.div custom={11} variants={fadeUp} className="mt-5 text-center">
            <p className="text-cream/30 font-body text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-gold hover:text-gold-light transition-colors font-medium"
              >
                Sign In
              </Link>
            </p>
          </motion.div>

          <motion.div
            custom={12}
            variants={fadeUp}
            className="mt-6 flex items-center gap-4"
          >
            <div className="flex-1 h-px bg-cream/5" />
            <span className="text-cream/20 text-xs font-body uppercase tracking-wider">
              Trusted by 50,000+ users
            </span>
            <div className="flex-1 h-px bg-cream/5" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
