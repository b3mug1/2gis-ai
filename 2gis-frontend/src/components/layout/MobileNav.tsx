import { Link, useLocation } from "react-router-dom";
import { Bookmark, History, Home, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

export function MobileNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useLanguage();

  const navItems = [
    { href: "/", icon: Home, label: t.sidebar.home },
    { href: "/chat", icon: MessageSquare, label: t.sidebar.chat },
    { href: "/favorites", icon: Bookmark, label: t.sidebar.favorites },
    { href: "/history", icon: History, label: t.sidebar.history },
    { href: "/settings", icon: Settings, label: t.sidebar.settings },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:hidden">
      <nav className="mx-auto max-w-md rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.95)] px-3 py-2 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-around gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-[hsl(var(--secondary))] text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "stroke-[2.2px] text-foreground" : "stroke-[1.8px]")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
