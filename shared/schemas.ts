import { z } from 'zod';
import { UNIDADES_ENTRADA, extractYouTubeId } from './units';

export const CATEGORIAS_RECETA = ['plato_principal', 'ensalada', 'pan', 'postre', 'extra', 'hallaca'] as const;
export const CATEGORIAS_INGREDIENTE = [
  'carnes', 'pescados_mariscos', 'vegetales', 'frutas', 'lacteos',
  'granos_harinas', 'condimentos', 'bebidas', 'otros',
] as const;

const fechaStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD');
const id = z.number().int().positive();

const youtube = z
  .union([z.string().url().refine((u) => extractYouTubeId(u) !== null, 'URL de YouTube no válida'), z.literal('')])
  .nullish()
  .transform((v) => (v === undefined ? undefined : v || null));

export const recipeInput = z.object({
  nombre: z.string().trim().min(1).max(120),
  categoria: z.enum(CATEGORIAS_RECETA),
  descripcion: z.string().max(2000).nullish(),
  procesoMd: z.string().max(50000).nullish(),
  videoYoutubeUrl: youtube,
  imagenDefaultId: id.nullish(),
  esEstandar: z.boolean().optional(),
});
export const recipeUpdate = recipeInput.partial();

export const eventInput = z.object({
  anio: z.number().int().min(2000).max(2100),
  fecha: fechaStr,
  nombre: z.string().trim().min(1).max(80),
  notas: z.string().max(20000).nullish(),
});
export const eventUpdate = eventInput.partial();

export const recipeEventInput = z.object({
  recipeId: id,
  eventId: id,
  cantidad: z.number().positive().max(100000).default(1),
  notas: z.string().max(5000).nullish(),
  /** Si se indica, copia ingredientes/cantidades de otra instancia (plantilla de años pasados). */
  templateFromRecipeEventId: id.optional(),
  copyPrices: z.boolean().default(false),
});
export const recipeEventUpdate = z.object({
  cantidad: z.number().positive().max(100000).optional(),
  notas: z.string().max(5000).nullish(),
});

export const ingredientLine = z
  .object({
    ingredientId: id.optional(),
    nombre: z.string().trim().min(1).max(120).optional(),
    categoria: z.enum(CATEGORIAS_INGREDIENTE).default('otros'),
    cantidad: z.number().min(0),
    unidad: z.enum(UNIDADES_ENTRADA),
    precioUsd: z.number().min(0).nullish(),
    precioUsdt: z.number().min(0).nullish(),
    fechaPrecio: fechaStr.nullish(),
  })
  .refine((l) => l.ingredientId || l.nombre, 'Indica ingredientId o nombre');
export const ingredientLinesInput = z.object({ items: z.array(ingredientLine).max(200) });

export const ingredientInput = z.object({
  nombre: z.string().trim().min(1).max(120),
  unidadBase: z.enum(['g', 'ml', 'unidad']),
  categoria: z.enum(CATEGORIAS_INGREDIENTE).default('otros'),
});

export const mediaInput = z.object({
  url: z.string().url(),
  tipo: z.enum(['imagen', 'video_youtube']).default('imagen'),
  anio: z.number().int().min(2000).max(2100),
  recipeId: id.nullish(),
  recipeEventId: id.nullish(),
});

export const reportQuery = z.object({
  anio: z.coerce.number().int().optional(),
  eventId: z.coerce.number().int().optional(),
  recipeId: z.coerce.number().int().optional(),
  categoria: z.enum(CATEGORIAS_INGREDIENTE).optional(),
});

export const shoppingGenerateInput = z.object({
  anio: z.number().int(),
  nombre: z.string().trim().min(1).max(120),
  /** Recetas que planeas hacer y cuántas unidades de cada una. */
  plan: z.array(z.object({ recipeId: id, cantidad: z.number().positive() })).min(1),
});
