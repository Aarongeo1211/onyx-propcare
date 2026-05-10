"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  MapPin,
  Phone,
  User,
  Building2,
  Heart,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@onyx/ui";

const navLinks = [
  { href: "/properties?type=FARMLAND", label: "Farmlands" },
  { href: "/properties?type=RESIDENTIAL_PLOT", label: "Plots" },
  {
    label: "Insights",
    children: [
      { href: "/insights/soil", label: "Soil Reports" },
      { href: "/insights/water", label: "Water Analysis" },
      { href: "/insights/legal", label: "Legal Checks" },
      { href: "/insights/drone", label: "Drone Maps" },
    ],
  },
  { href: "/calculator", label: "Calculator" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLoggedIn = status === "authenticated" && session?.user;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-onyx-950 border-b border-cream/5 text-cream/40 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Pan India Coverage
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              +91 98765 43210
            </span>
          </div>
          <span>India&apos;s Largest Farmland &amp; Plot Marketplace</span>
        </div>
      </div>

      {/* Main nav */}
      <motion.header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass shadow-lg shadow-black/30"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-gold rounded-lg rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
              <span className="absolute inset-0 flex items-center justify-center font-display text-onyx-950 font-bold text-lg">
                O
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-semibold tracking-wide text-cream">
                ONYX
              </span>
              <span className="text-[10px] font-body uppercase tracking-[0.3em] text-gold/70 -mt-1">
                Propcare
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              "children" in link ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setInsightsOpen(true)}
                  onMouseLeave={() => setInsightsOpen(false)}
                >
                  <button className="flex items-center gap-1 text-sm font-body text-cream/60 hover:text-gold transition-colors duration-300">
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${insightsOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {insightsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 py-2 w-48 glass rounded-xl shadow-2xl shadow-black/40"
                      >
                        {link.children?.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-cream/60 hover:text-gold hover:bg-gold/5 transition-all duration-200"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href!}
                  className="text-sm font-body text-cream/60 hover:text-gold transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold group-hover:w-full transition-all duration-300" />
                </Link>
              )
            )}
          </div>

          {/* CTA / User Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            {isLoggedIn ? (
              <>
              <Link
                href="/properties/new"
                className="relative px-5 py-2 text-sm font-medium text-onyx-950 bg-gradient-gold rounded-lg overflow-hidden group"
              >
                <span className="relative z-10">List Property</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 group"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-onyx-950 font-body font-semibold text-sm">
                    {session.user.avatar ? (
                      <img
                        src={session.user.avatar}
                        alt={session.user.name || "User"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(session.user.name || "U")
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-body text-cream/80 group-hover:text-cream transition-colors">
                      {session.user.name}
                    </div>
                    <div className="text-[10px] font-body text-cream/30 uppercase tracking-wider">
                      {session.user.role}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-cream/30 transition-transform duration-300 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-3 py-2 w-56 glass rounded-xl shadow-2xl shadow-black/50"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-cream/5">
                        <div className="text-sm font-body text-cream/80">
                          {session.user.name}
                        </div>
                        <div className="text-xs font-body text-cream/30 mt-0.5">
                          {session.user.email}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard/properties"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/60 hover:text-gold hover:bg-gold/5 transition-all duration-200"
                        >
                          <Building2 className="w-4 h-4" />
                          My Properties
                        </Link>
                        <Link
                          href="/dashboard/favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/60 hover:text-gold hover:bg-gold/5 transition-all duration-200"
                        >
                          <Heart className="w-4 h-4" />
                          Favorites
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/60 hover:text-gold hover:bg-gold/5 transition-all duration-200"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </div>

                      <div className="border-t border-cream/5 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/60 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-cream/60 hover:text-cream transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="relative px-6 py-2.5 text-sm font-medium text-onyx-950 bg-gradient-gold rounded-lg overflow-hidden group"
                >
                  <span className="relative z-10">List Property</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-cream/70 hover:text-gold transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden glass border-t border-cream/5"
            >
              <div className="px-6 py-6 space-y-4">
                {navLinks.map((link) =>
                  "children" in link ? (
                    <div key={link.label} className="space-y-2">
                      <span className="text-sm font-medium text-cream/40 uppercase tracking-wider">
                        {link.label}
                      </span>
                      {link.children?.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block pl-4 py-1.5 text-sm text-cream/60 hover:text-gold"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href!}
                      className="block py-2 text-cream/70 hover:text-gold"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                )}
                <div className="pt-4 border-t border-cream/10 flex flex-col gap-3">
                  <div className="flex justify-center lg:hidden">
                    <ThemeToggle />
                  </div>
                  {isLoggedIn ? (
                    <>
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-onyx-950 font-body font-semibold text-xs">
                          {getInitials(session.user.name || "U")}
                        </div>
                        <div>
                          <div className="text-sm text-cream/80">{session.user.name}</div>
                          <div className="text-[10px] text-cream/30 uppercase tracking-wider">
                            {session.user.role}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/properties/new"
                        className="text-center py-2.5 text-sm font-medium text-onyx-950 bg-gradient-gold rounded-lg"
                        onClick={() => setMobileOpen(false)}
                      >
                        List Property
                      </Link>
                      <Link
                        href="/dashboard/properties"
                        className="text-sm text-cream/60 hover:text-gold py-1.5 pl-4"
                        onClick={() => setMobileOpen(false)}
                      >
                        My Properties
                      </Link>
                      <Link
                        href="/dashboard/favorites"
                        className="text-sm text-cream/60 hover:text-gold py-1.5 pl-4"
                        onClick={() => setMobileOpen(false)}
                      >
                        Favorites
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-sm text-cream/60 hover:text-gold py-1.5 pl-4"
                        onClick={() => setMobileOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="text-center py-2.5 text-sm text-red-400 border border-red-400/20 rounded-lg mt-2"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-center py-2.5 text-sm text-cream/60 border border-cream/10 rounded-lg"
                        onClick={() => setMobileOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="text-center py-2.5 text-sm font-medium text-onyx-950 bg-gradient-gold rounded-lg"
                        onClick={() => setMobileOpen(false)}
                      >
                        List Property
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
