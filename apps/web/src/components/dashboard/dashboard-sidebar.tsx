"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  Heart,
  LogOut,
  Home,
  Settings,
  PhoneCall,
} from "lucide-react";
import { Badge } from "@onyx/ui";
import { Logo } from "@/components/brand/logo";

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
}

const sellerNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/properties", icon: Building2, label: "My Properties" },
  { href: "/dashboard/inquiries", icon: MessageSquare, label: "Inquiries" },
  { href: "/dashboard/callbacks", icon: PhoneCall, label: "Callbacks" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/dashboard/favorites", icon: Heart, label: "Favorites" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const buyerNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/favorites", icon: Heart, label: "Favorites" },
  { href: "/dashboard/inquiries", icon: MessageSquare, label: "My Inquiries" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "SELLER":
      return "default" as const;
    case "AGENT":
      return "farmland" as const;
    case "BUYER":
      return "residential" as const;
    case "ADMIN":
    case "SUPER_ADMIN":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems =
    user.role === "SELLER" || user.role === "AGENT"
      ? sellerNavItems
      : buyerNavItems;

  return (
    <aside className="w-[280px] h-screen bg-onyx-900/80 border-r border-cream/5 flex flex-col shrink-0 sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-cream/5">
        <Link href="/dashboard" aria-label="Onyx Propcare dashboard" className="inline-block">
          <Logo className="h-12 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? "bg-gold/10 text-gold border border-gold/15"
                  : "text-cream/40 hover:text-cream/70 hover:bg-cream/5"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User info + actions */}
      <div className="p-4 border-t border-cream/5 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center text-gold font-display text-sm font-semibold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-cream truncate">{user.name}</p>
            <Badge variant={getRoleBadgeVariant(user.role)} className="text-[10px] px-2 py-0">
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Back to Home */}
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-cream/40 hover:text-cream/70 hover:bg-cream/5 transition-all duration-200"
        >
          <Home className="w-4.5 h-4.5" />
          Back to Home
        </Link>

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-cream/30 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
