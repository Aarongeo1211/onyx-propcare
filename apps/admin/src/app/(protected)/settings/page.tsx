"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface PlatformSettingItem {
  id: string;
  key: string;
  label: string;
  category: string;
  value: unknown;
  description?: string | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;
  const [settings, setSettings] = useState<PlatformSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      void fetchSettings();
    }
  }, [token]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveSetting(setting: PlatformSettingItem) {
    setSavingKey(setting.key);
    try {
      await fetch(`${API_URL}/api/v1/admin/settings/${setting.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: setting.label,
          category: setting.category,
          description: setting.description || "",
          value: setting.value,
        }),
      });
      await fetchSettings();
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Platform Settings</h1>
        <p className="mt-1 text-sm text-cream/35">Edit live platform configuration records used by operations and support.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting, index) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-cream">{setting.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-cream/25">{setting.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveSetting(setting)}
                    disabled={savingKey === setting.key}
                    className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold hover:bg-gold/10 disabled:opacity-50"
                  >
                    {savingKey === setting.key ? "Saving..." : "Save"}
                  </button>
                </div>

                {setting.description && <p className="text-sm text-cream/35">{setting.description}</p>}

                <textarea
                  rows={6}
                  value={typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value, null, 2)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSettings((prev) =>
                      prev.map((item) =>
                        item.id === setting.id
                          ? {
                              ...item,
                              value: (() => {
                                try {
                                  return JSON.parse(nextValue);
                                } catch {
                                  return nextValue;
                                }
                              })(),
                            }
                          : item
                      )
                    );
                  }}
                  className="w-full rounded-xl border border-cream/10 bg-onyx-950/50 px-4 py-3 font-mono text-sm text-cream focus:border-gold/30 focus:outline-none"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
