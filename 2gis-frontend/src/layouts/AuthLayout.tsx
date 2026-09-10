import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4 sm:p-6 bg-background">
      <div className="orb absolute w-[500px] h-[500px] bg-[hsl(var(--primary)/0.08)] -top-40 -left-40 pointer-events-none rounded-full blur-3xl" />
      <div className="orb absolute w-[400px] h-[400px] bg-[hsl(var(--accent)/0.08)] -bottom-20 -right-20 pointer-events-none rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] pointer-events-none" />
      <Outlet />
    </div>
  );
}
