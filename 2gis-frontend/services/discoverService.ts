import { api } from "@/lib/api";

export interface SuggestResponse {
  suggestions: string[];
}

export const discoverService = {
  suggest: async (q: string, limit = 5): Promise<string[]> => {
    const res = await api.get<SuggestResponse>("/search/suggest", { params: { q, limit } });
    return res.data.suggestions;
  },

  getPopular: async (limit = 6) => {
    const res = await api.get<{ places: import("@/types/api").PlaceRecommendation[] }>("/search/popular", {
      params: { limit },
    });
    return res.data.places;
  },
};
