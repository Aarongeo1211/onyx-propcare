"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-onyx-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-gold to-gold-dark rounded-xl rotate-45" />
              <span className="absolute inset-0 flex items-center justify-center font-display text-onyx-950 font-bold text-lg">
                O
              </span>
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-cream">Admin Portal</h1>
          <p className="text-sm text-cream/30 mt-1">Sign in to manage Onyx Propcare</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-cream/5 bg-onyx-900/20 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-cream/30 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@onyxpropcare.com"
              required
              className="w-full bg-onyx-900/50 border border-cream/8 rounded-lg px-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-cream/30 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full bg-onyx-900/50 border border-cream/8 rounded-lg px-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-dark text-onyx-950 text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
