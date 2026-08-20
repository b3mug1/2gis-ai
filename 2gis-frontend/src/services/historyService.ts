import { api } from "@/lib/api";
import type { SearchHistoryResponse } from "@/types/api";

export const historyService = {
  list: async (): Promise<SearchHistoryResponse[]> => {
    const res = await api.get<SearchHistoryResponse[]>("/history");
    return res.data;
  },
};
