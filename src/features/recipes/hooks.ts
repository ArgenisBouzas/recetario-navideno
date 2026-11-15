import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Categoria, Recipe, RecipeDetail, RecipeListItem } from '@/lib/types';

export type RecipePayload = {
  nombre: string; categoria: Categoria; descripcion: string | null; procesoMd: string | null;
  videoYoutubeUrl: string | null; esEstandar: boolean;
};

export function useRecipes(filters: { categoria?: string; q?: string }) {
  const params = new URLSearchParams();
  if (filters.categoria) params.set('categoria', filters.categoria);
  if (filters.q) params.set('q', filters.q);
  return useQuery({ queryKey: ['recipes', filters], queryFn: () => api<RecipeListItem[]>(`/recipes?${params}`) });
}

export const useRecipe = (id?: number) =>
  useQuery({ queryKey: ['recipe', id], queryFn: () => api<RecipeDetail>(`/recipes/${id}`), enabled: !!id });

export function useSaveRecipe(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecipePayload) =>
      id ? api<Recipe>(`/recipes/${id}`, { method: 'PUT', json: data }) : api<Recipe>('/recipes', { method: 'POST', json: data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); qc.invalidateQueries({ queryKey: ['recipe'] }); },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<{ ok: true }>(`/recipes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
