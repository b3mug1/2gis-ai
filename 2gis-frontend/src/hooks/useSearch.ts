import { useMutation } from "@tanstack/react-query";
import { searchService } from "@/services/searchService";
import { queryClient } from "@/lib/queryClient";
import type { SearchRequest, SearchResponse } from "@/types/api";

export function useSearch() {
  return useMutation<SearchResponse, Error, SearchRequest>({
    mutationFn: (data) => searchService.search(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
