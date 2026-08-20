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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 bg-[hsl(var(--background))]">
      <div className="orb w-[500px] h-[500px] bg-[hsl(var(--card)/0.4)] -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-[hsl(var(--accent)/0.1)] -bottom-40 -left-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
      <Outlet />
    </div>
  );
}
