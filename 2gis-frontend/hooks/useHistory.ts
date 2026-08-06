import { useQuery } from "@tanstack/react-query";
import { historyService } from "@/services/historyService";
import { useAuth } from "@/features/auth/AuthContext";
import type { SearchHistoryResponse } from "@/types/api";

export function useHistory() {
  const { isAuthenticated } = useAuth();
  return useQuery<SearchHistoryResponse[]>({
    queryKey: ["history"],
    queryFn: historyService.list,
    enabled: isAuthenticated,
  });
}
