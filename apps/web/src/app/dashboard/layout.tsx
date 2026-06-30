"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useLayout } from "@/components/providers/layout-provider";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setIsDashboard } = useLayout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsDashboard(true);
    return () => setIsDashboard(false);
  }, [setIsDashboard]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user && !session.user.phone) {
      router.replace(`/auth/complete?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-onyx-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user || !session.user.phone) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-onyx-950">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-onyx-900/80 border border-cream/10 text-cream"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <DashboardSidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
            avatar: session.user.avatar,
          }}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto w-full md:w-auto">{children}</div>
    </div>
  );
}
