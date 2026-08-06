"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Heart, History, Home, Settings, User } from "lucide-react";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/chat", icon: Bot, label: "Chat" },
  { href: "/favorites", icon: Heart, label: "Saved" },
  { href: "/history", icon: History, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[hsl(var(--border))] glass py-2 px-4">
      <div className="flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                active
                  ? "text-brand-500 dark:text-brand-400"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
