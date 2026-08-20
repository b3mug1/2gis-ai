import { useQuery } from "@tanstack/react-query";
import { statisticsService } from "@/services/statisticsService";
import { useAuth } from "@/features/auth/AuthContext";
import type { SearchStatisticsResponse } from "@/types/api";

export function useStatistics() {
  const { isAuthenticated } = useAuth();
  return useQuery<SearchStatisticsResponse[]>({
    queryKey: ["statistics"],
    queryFn: statisticsService.get,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 15,
  });
}
