import { api } from "@/lib/api";
import type { SearchStatisticsResponse } from "@/types/api";

export const statisticsService = {
  get: async (): Promise<SearchStatisticsResponse[]> => {
    const res = await api.get<SearchStatisticsResponse[]>("/statistics");
    return res.data;
  },
};
