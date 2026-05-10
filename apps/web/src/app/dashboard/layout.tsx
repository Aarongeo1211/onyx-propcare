"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/providers/layout-provider";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setIsDashboard } = useLayout();

  useEffect(() => {
    setIsDashboard(true);
    return () => setIsDashboard(false);
  }, [setIsDashboard]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-onyx-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-onyx-950">
      <DashboardSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          avatar: session.user.avatar,
        }}
      />
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
    </div>
  );
}
