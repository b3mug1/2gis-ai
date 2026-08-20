import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useAuth } from "@/features/auth/AuthContext";
import type { UserResponse } from "@/types/api";

export function useProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery<UserResponse>({
    queryKey: ["profile"],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });
}
