"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Search } from "lucide-react";
import { Button } from "@onyx/ui";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PropertyCard } from "@/components/properties/property-card";
import type { PropertyCardData } from "@/components/properties/property-card";
import { useApiQuery, useRemoveFavorite } from "@/lib/hooks";

interface FavoriteItem {
  id: string;
  propertyId: string;
  property: PropertyCardData;
}

export default function DashboardFavoritesPage() {
  const { data: session } = useSession();
  const { data: favRes, isLoading: loading } = useApiQuery<{ success: boolean; data: FavoriteItem[] }>(
    ["favorites"],
    "/favorites"
  );
  const favorites = favRes?.data || [];
  const removeMutation = useRemoveFavorite();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function removeFavorite(propertyId: string) {
    setRemovingId(propertyId);
    try {
      await removeMutation.mutateAsync(propertyId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <DashboardHeader
        title="Favorites"
        subtitle="Your saved properties"
        user={session?.user ? { name: session.user.name, avatar: session.user.avatar } : undefined}
      />

      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-onyx-900/50 border border-cream/8 flex items-center justify-center">
                <Heart className="w-8 h-8 text-cream/90" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">
                No saved properties yet
              </h3>
              <p className="text-sm font-body text-cream/84 mb-6">
                Browse properties to save your favorites for easy access later.
              </p>
              <Link href="/properties">
                <Button variant="outline">
                  <Search className="w-4 h-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {favorites.map((fav, i) => (
                <div key={fav.id} className="relative group">
                  <PropertyCard property={fav.property} index={i} />

                  {/* Remove favorite button overlay */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavorite(fav.propertyId);
                    }}
                    disabled={removingId === fav.propertyId}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-onyx-950/70 backdrop-blur-sm border border-cream/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50"
                    title="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
