import { api } from "@/lib/api";
import type { FavoriteCreateRequest, FavoriteResponse, MessageResponse } from "@/types/api";

export const favoritesService = {
  list: async (): Promise<FavoriteResponse[]> => {
    const res = await api.get<FavoriteResponse[]>("/favorites");
    return res.data;
  },

  add: async (data: FavoriteCreateRequest): Promise<FavoriteResponse> => {
    const res = await api.post<FavoriteResponse>("/favorites", data);
    return res.data;
  },

  remove: async (id: string): Promise<MessageResponse> => {
    const res = await api.delete<MessageResponse>(`/favorites/${id}`);
    return res.data;
  },
};
