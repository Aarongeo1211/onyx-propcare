"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const SELLER_ROLES = new Set(["SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]);

export default function AuthCompletePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    router.replace(SELLER_ROLES.has(session.user.role) ? "/dashboard" : "/");
  }, [router, session, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-onyx-950">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
    </div>
  );
}
