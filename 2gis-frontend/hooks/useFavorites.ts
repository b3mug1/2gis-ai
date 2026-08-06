import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "@/services/favoritesService";
import type { FavoriteCreateRequest, FavoriteResponse } from "@/types/api";
import { useAuth } from "@/features/auth/AuthContext";

const QUERY_KEY = ["favorites"];

export function useFavorites() {
  const { isAuthenticated } = useAuth();

  const query = useQuery<FavoriteResponse[]>({
    queryKey: QUERY_KEY,
    queryFn: favoritesService.list,
    enabled: isAuthenticated,
  });

  return query;
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation<FavoriteResponse, Error, FavoriteCreateRequest>({
    mutationFn: favoritesService.add,
    onSuccess: (newFav) => {
      qc.setQueryData<FavoriteResponse[]>(QUERY_KEY, (old = []) => [
        newFav,
        ...old,
      ]);
    },
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: favoritesService.remove,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<FavoriteResponse[]>(QUERY_KEY);
      qc.setQueryData<FavoriteResponse[]>(QUERY_KEY, (old = []) =>
        old.filter((f) => f.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      const ctx = context as { previous?: FavoriteResponse[] };
      if (ctx?.previous) {
        qc.setQueryData(QUERY_KEY, ctx.previous);
      }
    },
  });
}
