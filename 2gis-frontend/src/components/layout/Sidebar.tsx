import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Heart,
  History,
  Home,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
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
    navItems.push({ href: "/admin", icon: ShieldCheck, label: "Admin" });
  }

  async function handleLogout() {
    await logout();
    toast.info(t.settings.signedOut);
    navigate("/login");
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative z-30 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar-bg))] md:flex sticky top-0"
    >
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--border))] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
          <MapPin className="h-4 w-4" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground"
            >
              City Guide <span className="text-[hsl(var(--primary))]">AI</span>
            </motion.span>
          )}
        </AnimatePresence>

      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[hsl(var(--secondary))] text-foreground"
                  : "text-muted-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground"
              )}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[hsl(var(--primary))]" />}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-[hsl(var(--primary))]" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="space-y-2 border-t border-[hsl(var(--border))] p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[hsl(var(--card)/0.75)] px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-xs font-bold text-foreground">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{user.full_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-[hsl(var(--muted))] hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {t.sidebar.logout}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "absolute -right-4 top-1/2 z-50 -translate-y-1/2 flex h-14 w-9 items-center justify-center",
          "rounded-l-[1.25rem] rounded-r-full border border-[hsl(var(--border))]",
          "bg-[hsl(var(--card)/0.96)] text-muted-foreground shadow-[0_16px_38px_-22px_hsl(0_0%_0%/0.5)] backdrop-blur-xl",
          "transition-all duration-200 hover:-translate-y-1/2 hover:border-[hsl(var(--primary))] hover:text-foreground hover:shadow-[0_20px_44px_-24px_hsl(0_0%_0%/0.6)]"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <motion.span
          animate={{ x: collapsed ? 1 : -1 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--secondary))]"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </motion.span>
      </button>
    </motion.aside>
  );
}
