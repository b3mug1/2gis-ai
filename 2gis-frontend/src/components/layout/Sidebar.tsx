import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Compass,
  History,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { href: "/", icon: Home, label: t.sidebar.home },
    { href: "/chat", icon: MessageSquare, label: t.sidebar.chat },
    { href: "/history", icon: History, label: t.sidebar.history },
    { href: "/favorites", icon: Bookmark, label: t.sidebar.favorites },
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
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className="relative z-30 hidden h-screen shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar-bg))] md:flex sticky top-0 select-none"
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-[hsl(var(--border))] px-3.5">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 transition-opacity hover:opacity-85",
            collapsed && "mx-auto justify-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
            <MapPin className="h-4 w-4" />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                <span className="text-sm font-bold tracking-tight text-foreground">
                  City Guide <span className="text-[hsl(var(--muted-foreground))]">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Astana Guide
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(var(--secondary))] hover:text-foreground"
            title="Свернуть панель"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-6">
        <div>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70"
              >
                Навигация
              </motion.p>
            )}
          </AnimatePresence>

          <nav className="space-y-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  to={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    collapsed && "justify-center px-0 py-3",
                    active
                      ? "border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-[hsl(var(--secondary)/0.5)] hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-foreground stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground stroke-[1.8]"
                    )}
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--foreground))]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / User Profile & Controls */}
      <div className="border-t border-[hsl(var(--border))] p-2.5 space-y-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[hsl(var(--secondary))] hover:text-foreground"
              title="Развернуть панель"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>

            {user ? (
              <button
                onClick={() => navigate("/profile")}
                title={user.full_name}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-xs font-bold text-foreground hover:border-[hsl(var(--foreground)/0.3)] transition-colors"
              >
                {user.full_name.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                title="Войти"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              >
                <User className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            {user ? (
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 shadow-sm transition-all hover:border-[hsl(var(--foreground)/0.2)]">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-xs font-bold text-foreground">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">{user.full_name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title={t.sidebar.logout}
                    aria-label="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="btn-minimal btn-minimal-primary w-full py-2 text-xs"
              >
                <User className="h-3.5 w-3.5" />
                <span>Войти в аккаунт</span>
              </button>
            )}
          </>
        )}
      </div>
    </motion.aside>
  );
}
