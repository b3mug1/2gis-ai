import { api } from "@/lib/api";
import type { SearchRequest, SearchResponse } from "@/types/api";

export const searchService = {
  search: async (data: SearchRequest): Promise<SearchResponse> => {
    const res = await api.post<SearchResponse>("/search", data);
    return res.data;
  },
};
