import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/features/auth/AuthContext";
import { motion } from "framer-motion";

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">
        <div className="w-10 h-10 rounded-full border-2 border-[hsl(var(--primary)/0.3)] border-t-[hsl(var(--primary))] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="h-full pb-20 md:pb-0"
        >
          <Outlet />
        </motion.div>
      </main>
      <MobileNav />
    </div>
  );
}
