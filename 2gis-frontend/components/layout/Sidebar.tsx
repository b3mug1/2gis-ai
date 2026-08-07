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
  ShieldCheck,
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

  if (user?.role === "admin") {
    navItems.push({ href: "/admin", icon: ShieldCheck, label: "Админ-панель" });
  }

  async function handleLogout() {
    await logout();
    toast.info(t.settings.signedOut);
    router.push("/login");
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className="relative hidden md:flex flex-col h-screen sticky top-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar-bg))] shrink-0 z-30"
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--border))] overflow-hidden">
        <div className="w-8 h-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-bold text-base text-foreground tracking-tight whitespace-nowrap"
            >
              City Guide <span className="text-[hsl(var(--primary))] font-semibold">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-[hsl(var(--secondary))] text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))/0.5]"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[hsl(var(--primary))] rounded-r" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-[hsl(var(--primary))]" : "text-muted-foreground group-hover:text-foreground"
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
        <div className="border-t border-[hsl(var(--border))] p-3 space-y-1.5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            <div className="w-7 h-7 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-foreground flex items-center justify-center text-xs font-bold shrink-0">
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
                  <p className="text-xs font-semibold text-foreground truncate">{user.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
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
        className="absolute -right-3 top-5 w-6 h-6 rounded-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-muted-foreground hover:text-foreground flex items-center justify-center shadow-xs transition-colors z-50 cursor-pointer"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </motion.aside>
  );
}
