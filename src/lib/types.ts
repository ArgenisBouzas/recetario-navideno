import type { CATEGORIAS_RECETA } from '@shared/schemas';

export type Categoria = (typeof CATEGORIAS_RECETA)[number];

export type Recipe = {
  id: number; nombre: string; categoria: Categoria; descripcion: string | null; procesoMd: string | null;
  videoYoutubeUrl: string | null; imagenDefaultId: number | null; esEstandar: boolean;
};
export type RecipeListItem = Recipe & { imagenDefaultUrl: string | null; veces: number; ultimoAnio: number | null };
export type MediaItem = { id: number; url: string; tipo: 'imagen' | 'video_youtube'; anio: number };
export type RecipeDetail = Recipe & {
  galeria: MediaItem[];
  historial: { recipeEventId: number; eventId: number; anio: number; evento: string; fecha: string; cantidad: number }[];
};

export type EventListItem = { id: number; anio: number; fecha: string; nombre: string; platos: number };
export type IngredienteDetalle = {
  id: number; ingredientId: number; nombre: string; categoria: string; unidadBase: 'g' | 'ml' | 'unidad';
  cantidadBase: number; precioUsd: number | null; precioUsdt: number | null; fechaPrecio: string | null;
};
export type EventDetail = EventListItem & {
  notas: string | null; totalUsd: number; totalUsdt: number;
  recetas: { id: number; recipeId: number; nombre: string; categoria: Categoria; cantidad: number; notas: string | null;
    ingredientes: IngredienteDetalle[]; imagenes: { id: number; url: string }[]; totalUsd: number; totalUsdt: number }[];
};
export type RecipeEventDetail = {
  id: number; recipeId: number; recetaNombre: string; eventId: number; eventoNombre: string; anio: number;
  cantidad: number; notas: string | null; ingredientes: IngredienteDetalle[]; imagenes: { id: number; url: string; anio: number }[];
};
export type IngredientSuggestion = {
  id: number; nombre: string; unidadBase: 'g' | 'ml' | 'unidad'; categoria: string;
  ultimoPrecio: { cantidadBase: number; precioUsd: number | null; precioUsdt: number | null; fecha: string } | null;
};
export type TemplateSource = { recipeEventId: number; anio: number; evento: string; cantidad: number; ingredientes: number };
