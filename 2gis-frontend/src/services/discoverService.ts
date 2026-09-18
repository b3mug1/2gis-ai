import { api } from "@/lib/api";

export interface SuggestResponse {
  suggestions: string[];
}

export const discoverService = {
  suggest: async (q: string, limit = 5, signal?: AbortSignal): Promise<string[]> => {
    const res = await api.get<SuggestResponse>("/search/suggest", {
      params: { q, limit },
      signal,
    });
    return res.data.suggestions;
  },

  getPopular: async (limit = 6) => {
    const res = await api.get<{ places: import("@/types/api").PlaceRecommendation[] }>("/search/popular", {
      params: { limit },
    });
    return res.data.places;
  },
};
