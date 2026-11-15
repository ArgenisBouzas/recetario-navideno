import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventDetail, EventListItem, IngredientSuggestion, MediaItem, RecipeEventDetail, TemplateSource } from '@/lib/types';

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => Promise.all(['events', 'event', 'years', 'recipe-event', 'recipes', 'recipe', 'media'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
};

export const useYears = () => useQuery({ queryKey: ['years'], queryFn: () => api<number[]>('/events/years') });
export const useEvents = (anio: number) => useQuery({ queryKey: ['events', anio], queryFn: () => api<EventListItem[]>(`/events?anio=${anio}`) });
export const useEvent = (id: number) => useQuery({ queryKey: ['event', id], queryFn: () => api<EventDetail>(`/events/${id}`), enabled: !!id });

export function useEventMutations() {
  const inv = useInvalidate();
  return {
    create: useMutation({ mutationFn: (d: { anio: number; fecha: string; nombre: string }) => api<EventListItem>('/events', { method: 'POST', json: d }), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, ...d }: { id: number; notas?: string | null; nombre?: string; fecha?: string }) => api(`/events/${id}`, { method: 'PUT', json: d }), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: number) => api(`/events/${id}`, { method: 'DELETE' }), onSuccess: inv }),
  };
}

export const useRecipeEvent = (id: number) => useQuery({ queryKey: ['recipe-event', id], queryFn: () => api<RecipeEventDetail>(`/recipe-events/${id}`), enabled: !!id });
export const useTemplateSources = (id: number) => useQuery({ queryKey: ['template-sources', id], queryFn: () => api<TemplateSource[]>(`/recipe-events/${id}/template-sources`), enabled: !!id });

export function useRecipeEventMutations(id?: number) {
  const inv = useInvalidate();
  return {
    create: useMutation({ mutationFn: (d: { recipeId: number; eventId: number; cantidad: number }) => api<{ id: number }>('/recipe-events', { method: 'POST', json: d }), onSuccess: inv }),
    update: useMutation({ mutationFn: (d: { cantidad?: number; notas?: string | null }) => api(`/recipe-events/${id}`, { method: 'PUT', json: d }), onSuccess: inv }),
    remove: useMutation({ mutationFn: (rid: number) => api(`/recipe-events/${rid}`, { method: 'DELETE' }), onSuccess: inv }),
    saveIngredients: useMutation({ mutationFn: (items: unknown[]) => api(`/recipe-events/${id}/ingredients`, { method: 'PUT', json: { items } }), onSuccess: inv }),
    importTemplate: useMutation({ mutationFn: (d: { fromRecipeEventId: number; copyPrices: boolean }) => api(`/recipe-events/${id}/import`, { method: 'POST', json: d }), onSuccess: inv }),
  };
}

export const useIngredientSearch = (q: string) =>
  useQuery({ queryKey: ['ingredients', q], queryFn: () => api<IngredientSuggestion[]>(`/ingredients?q=${encodeURIComponent(q)}&limit=8`), enabled: q.trim().length > 0, staleTime: 60_000 });

export const useMediaLibrary = (recipeId: number | undefined, enabled: boolean) =>
  useQuery({ queryKey: ['media', recipeId ?? 'all'], queryFn: () => api<MediaItem[]>(`/media${recipeId ? `?recipeId=${recipeId}` : ''}`), enabled });

export function useMediaMutations() {
  const inv = useInvalidate();
  return {
    register: useMutation({ mutationFn: (d: { url: string; anio: number; recipeId: number; recipeEventId: number }) => api<MediaItem>('/media', { method: 'POST', json: { ...d, tipo: 'imagen' } }), onSuccess: inv }),
    link: useMutation({ mutationFn: (d: { mediaId: number; recipeEventId: number }) => api(`/media/${d.mediaId}/link`, { method: 'POST', json: { recipeEventId: d.recipeEventId } }), onSuccess: inv }),
    unlink: useMutation({ mutationFn: (d: { mediaId: number; recipeEventId: number }) => api(`/media/${d.mediaId}/link/${d.recipeEventId}`, { method: 'DELETE' }), onSuccess: inv }),
    setDefault: useMutation({ mutationFn: (d: { recipeId: number; imagenDefaultId: number | null }) => api(`/recipes/${d.recipeId}`, { method: 'PUT', json: { imagenDefaultId: d.imagenDefaultId } }), onSuccess: inv }),
  };
}
