"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  History,
  Heart,
  User,
  Settings,
  LogOut,
  Home,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { href: "/", icon: Home, label: t.sidebar.home },
    { href: "/chat", icon: Bot, label: t.sidebar.chat },
    { href: "/history", icon: History, label: t.sidebar.history },
    { href: "/favorites", icon: Heart, label: t.sidebar.favorites },
    { href: "/profile", icon: User, label: t.sidebar.profile },
    { href: "/settings", icon: Settings, label: t.sidebar.settings },
  ];

  async function handleLogout() {
    await logout();
    toast.info(t.settings.signedOut);
    router.push("/login");
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative hidden md:flex flex-col h-screen sticky top-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar-bg))] shrink-0 overflow-hidden z-20 shadow-xl"
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-5 h-20 border-b border-[hsl(var(--border))]">
        <div className="w-10 h-10 rounded-2xl bg-brand-400 text-black flex items-center justify-center shrink-0 shadow-md shadow-brand-400/25">
          <MapPin className="w-5 h-5 stroke-[2.5]" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="font-extrabold text-lg text-foreground tracking-tight whitespace-nowrap"
            >
              City Guide <span className="text-brand-400">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-extrabold transition-all duration-200",
                active
                  ? "bg-brand-400 text-black shadow-lg shadow-brand-400/30 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                  active ? "text-black" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Area at Bottom */}
      {user && (
        <div className="border-t border-[hsl(var(--border))] p-4 space-y-2 bg-card/40">
          <div className="flex items-center gap-3 px-2 py-2 rounded-2xl">
            <div className="w-9 h-9 rounded-2xl bg-brand-400 text-black flex items-center justify-center text-xs font-extrabold shrink-0 shadow-md shadow-brand-400/20">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <p className="text-xs font-extrabold text-foreground truncate">{user.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/15 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {t.sidebar.logout}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-24 w-7 h-7 rounded-full bg-card border border-[hsl(var(--border))] flex items-center justify-center text-muted-foreground hover:text-brand-400 hover:border-brand-400 transition-all shadow-md z-30"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
