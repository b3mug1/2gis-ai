import { Link, useLocation } from "react-router-dom";
import { Bot, Heart, History, Home, Settings } from "lucide-react";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/chat", icon: Bot, label: "Chat" },
  { href: "/favorites", icon: Heart, label: "Saved" },
  { href: "/history", icon: History, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:hidden">
      <nav className="mx-auto max-w-md rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.92)] px-3 py-2 shadow-[0_24px_60px_-32px_hsl(0_0%_0%/0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-around gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "stroke-[2.2px]")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
