"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  ScrollText,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/properties", icon: Building2, label: "Properties" },
  { href: "/users", icon: Users, label: "Users" },
  { href: "/inquiries", icon: MessageSquare, label: "Inquiries" },
  { href: "/audit-log", icon: ScrollText, label: "Audit Log" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-onyx-950 border-r border-cream/5 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-cream/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-gradient-to-br from-gold to-gold-dark rounded-lg rotate-45" />
            <span className="absolute inset-0 flex items-center justify-center font-display text-onyx-950 font-bold text-sm">
              O
            </span>
          </div>
          <div>
            <span className="font-display text-lg font-semibold text-cream">ONYX</span>
            <span className="text-[9px] font-body uppercase tracking-[0.3em] text-gold/50 block -mt-0.5">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

      {/* Bottom */}
      <div className="p-4 border-t border-cream/5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-cream/30 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="w-4.5 h-4.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
