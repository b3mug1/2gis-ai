"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      <div className="orb w-[500px] h-[500px] bg-brand-500/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-purple-500/10 -bottom-40 -left-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--brand-500)/0.05)_0%,transparent_70%)]" />
      {children}
    </div>
  );
}
