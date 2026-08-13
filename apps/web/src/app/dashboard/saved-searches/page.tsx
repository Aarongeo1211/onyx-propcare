"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, Search, Trash2, Bell, BellOff } from "lucide-react";
import { Button } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  useSavedSearches,
  useUpdateSavedSearch,
  useDeleteSavedSearch,
  type SavedSearchItem,
} from "@/lib/hooks";
import { formatPriceFull, getPropertyTypeLabel } from "@/lib/utils";

function describeSavedSearch(s: SavedSearchItem): string {
  const parts: string[] = [];
  if (s.type) parts.push(getPropertyTypeLabel(s.type));
  if (s.listingType) parts.push(s.listingType === "SALE" ? "for sale" : s.listingType === "LEASE" ? "for lease" : "for rent");
  if (s.district) parts.push(`in ${s.district}`);
  else if (s.state) parts.push(`in ${s.state}`);
  if (s.minPrice && s.maxPrice) parts.push(`${formatPriceFull(s.minPrice)} - ${formatPriceFull(s.maxPrice)}`);
  else if (s.minPrice) parts.push(`above ${formatPriceFull(s.minPrice)}`);
  else if (s.maxPrice) parts.push(`under ${formatPriceFull(s.maxPrice)}`);
  if (s.search) parts.push(`matching "${s.search}"`);
  return parts.length > 0 ? parts.join(" · ") : "Any property";
}

export default function SavedSearchesPage() {
  const { data: session } = useSession();
  const { data, isLoading: loading } = useSavedSearches();
  const searches = data?.data || [];
  const updateMutation = useUpdateSavedSearch();
  const deleteMutation = useDeleteSavedSearch();

  return (
    <>
      <DashboardHeader
        title="Saved Searches"
        subtitle="Get notified when new listings match your criteria"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : searches.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-onyx-900/50 border border-cream/8 flex items-center justify-center">
                <BellRing className="w-8 h-8 text-cream/90" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">No saved searches yet</h3>
              <p className="text-sm font-body text-cream/84 mb-6 max-w-md mx-auto">
                Search for properties, then save your filters to get an email when new matching listings go live.
              </p>
              <Link href="/properties">
                <Button variant="outline">
                  <Search className="w-4 h-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl">
              {searches.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-cream/8 bg-onyx-900/50 p-5"
                >
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-cream truncate">
                      {s.name || describeSavedSearch(s)}
                    </p>
                    {s.name && <p className="mt-1 text-sm text-cream/70 truncate">{describeSavedSearch(s)}</p>}
                    <p className="mt-1 text-xs text-cream/40">
                      {s.active ? "Alerts on — checked daily" : "Alerts paused"}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateMutation.mutate({ id: s.id, active: !s.active })}
                      title={s.active ? "Pause alerts" : "Resume alerts"}
                      className="flex items-center gap-1.5 rounded-lg border border-cream/10 px-3 py-2 text-xs text-cream/70 hover:border-gold/30 hover:text-gold"
                    >
                      {s.active ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                      {s.active ? "On" : "Paused"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(s.id)}
                      title="Delete saved search"
                      className="rounded-lg border border-red-500/15 p-2 text-red-400/80 hover:border-red-500/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
