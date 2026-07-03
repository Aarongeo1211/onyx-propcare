"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Phone } from "lucide-react";
import { Button, Input } from "@onyx/ui";
import { Logo } from "@/components/brand/logo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

const SELLER_ROLES = new Set(["SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]);

function getDefaultDestination(role?: string, next?: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return role && SELLER_ROLES.has(role) ? "/dashboard" : "/";
}

export default function AuthCompletePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [phone, setPhone] = useState("");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [nextPathLoaded, setNextPathLoaded] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const destination = getDefaultDestination(session?.user?.role, nextPath);

  useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get("next"));
    setNextPathLoaded(true);
  }, []);

  useEffect(() => {
    if (status === "loading" || !nextPathLoaded) return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    if (session.user.phone) {
      router.replace(destination);
      return;
    }

    const accessToken = session.user.accessToken;
    let cancelled = false;
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.success && data.data?.phone) {
          await update({
            phone: data.data.phone,
            phoneVerifiedAt: data.data.phoneVerifiedAt ?? null,
            name: data.data.name,
            avatar: data.data.avatar,
            role: data.data.role,
          });
          router.replace(destination);
          return;
        }

        setPhone(data.data?.phone || "");
      } catch {
        if (!cancelled) setError("Could not load your profile. Please try again.");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [destination, nextPathLoaded, router, session, status, update]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.user?.accessToken) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Could not save phone number");
        return;
      }

      await update({
        phone: data.data.phone,
        phoneVerifiedAt: data.data.phoneVerifiedAt ?? null,
        name: data.data.name,
        avatar: data.data.avatar,
        role: data.data.role,
      });
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Could not save phone number. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || !nextPathLoaded || loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-onyx-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-onyx-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border border-cream/10 bg-onyx-900/60 p-8 shadow-2xl shadow-black/20"
      >
        <div className="mb-8 flex justify-center">
          <Logo className="h-20 w-auto" />
        </div>

        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
            <Phone className="h-5 w-5" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-cream">Add Phone Number</h1>
          <p className="mt-2 text-sm leading-6 text-cream/90">
            Phone is now required for account security and property communication.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-cream/81">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              required
              autoComplete="tel"
            />
            <p className="mt-2 text-xs text-cream/82">Use a number where buyers and sellers can reach you.</p>
          </div>

          <Button type="submit" disabled={saving} className="h-12 w-full">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-onyx-950/30 border-t-onyx-950" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
