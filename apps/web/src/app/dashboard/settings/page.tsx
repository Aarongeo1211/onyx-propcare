"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Lock, Save, Check, AlertCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "http://localhost:4000/api/v1";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneVerifiedAt: string | null;
  role: string;
  avatar: string | null;
  emailVerified: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const token = session?.user?.accessToken;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setName(data.data.name);
          setPhone(data.data.phone || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setProfileMsg({ type: "ok", text: "Profile updated successfully" });
        await update({
          name: data.data.name,
          phone: data.data.phone,
          phoneVerifiedAt: data.data.phoneVerifiedAt ?? null,
        });
      } else {
        const errText = Array.isArray(data.error) ? data.error[0]?.message : data.error;
        setProfileMsg({ type: "err", text: errText || "Failed to update profile" });
      }
    } catch {
      setProfileMsg({ type: "err", text: "Network error" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New passwords do not match" });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ type: "ok", text: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errText = Array.isArray(data.error) ? data.error[0]?.message : data.error;
        setPasswordMsg({ type: "err", text: errText || "Failed to change password" });
      }
    } catch {
      setPasswordMsg({ type: "err", text: "Network error" });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <DashboardHeader
        title="Account Settings"
        subtitle="Manage your profile and password"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8 max-w-3xl space-y-8">
        {/* Profile section */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-onyx-900/40 border border-cream/8 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <User className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-lg text-cream">Profile</h2>
              <p className="text-xs text-cream/84">Update your personal details</p>
            </div>
          </div>

          {loading ? (
            <div className="text-cream/84 text-sm">Loading...</div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full px-4 py-2.5 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 bg-onyx-950/30 border border-cream/5 rounded-lg text-sm text-cream/78 cursor-not-allowed"
                />
                <p className="text-[11px] text-cream/81 mt-1">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-4 py-2.5 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">Role</label>
                <input
                  type="text"
                  value={profile?.role || ""}
                  disabled
                  className="w-full px-4 py-2.5 bg-onyx-950/30 border border-cream/5 rounded-lg text-sm text-cream/78 cursor-not-allowed"
                />
              </div>

              {profileMsg && (
                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    profileMsg.type === "ok"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {profileMsg.type === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-sm text-gold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </form>
          )}
        </motion.section>

        {/* Password section */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-onyx-900/40 border border-cream/8 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-lg text-cream">Change Password</h2>
              <p className="text-xs text-cream/84">Min 8 chars, with uppercase, lowercase, number</p>
            </div>
          </div>

          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-cream/78 mb-1.5 block">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
              />
            </div>

            {passwordMsg && (
              <div
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                  passwordMsg.type === "ok"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {passwordMsg.type === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-sm text-gold transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {savingPassword ? "Changing..." : "Change password"}
            </button>
          </form>
        </motion.section>
      </div>
    </>
  );
}
