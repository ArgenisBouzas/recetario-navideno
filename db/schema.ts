import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, integer, text, boolean, timestamp, date, numeric,
  uniqueIndex, index, primaryKey, type AnyPgColumn,
} from 'drizzle-orm/pg-core';

// ───────── Enums ─────────
export const categoriaReceta = pgEnum('categoria_receta', [
  'plato_principal', 'ensalada', 'pan', 'postre', 'extra', 'hallaca',
]);
export const categoriaIngrediente = pgEnum('categoria_ingrediente', [
  'carnes', 'pescados_mariscos', 'vegetales', 'frutas', 'lacteos',
  'granos_harinas', 'condimentos', 'bebidas', 'otros',
]);
export const unidadBase = pgEnum('unidad_base', ['g', 'ml', 'unidad']);
export const tipoMedia = pgEnum('tipo_media', ['imagen', 'video_youtube']);

const num = (name: string, precision = 14, scale = 3) =>
  numeric(name, { precision, scale, mode: 'number' });
const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

// ───────── Recetas ─────────
export const recipes = pgTable('recipes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull(),
  categoria: categoriaReceta('categoria').notNull(),
  descripcion: text('descripcion'),
  procesoMd: text('proceso_md'),
  videoYoutubeUrl: text('video_youtube_url'),
  imagenDefaultId: integer('imagen_default_id').references((): AnyPgColumn => media.id, { onDelete: 'set null' }),
  esEstandar: boolean('es_estandar').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [uniqueIndex('recipes_nombre_lower').on(sql`lower(${t.nombre})`)]);

// ───────── Ingredientes (catálogo) ─────────
export const ingredients = pgTable('ingredients', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  nombre: text('nombre').notNull(),
  unidadBase: unidadBase('unidad_base').notNull(),
  categoria: categoriaIngrediente('categoria').notNull().default('otros'),
}, (t) => [uniqueIndex('ingredients_nombre_lower').on(sql`lower(${t.nombre})`)]);

// ───────── Eventos ─────────
export const events = pgTable('events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  anio: integer('anio').notNull(),
  fecha: date('fecha', { mode: 'string' }).notNull(),
  nombre: text('nombre').notNull(),
  notas: text('notas'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('events_anio_nombre').on(t.anio, t.nombre), index('events_anio_idx').on(t.anio)]);

// ───────── "Hice X receta en Y evento" ─────────
export const recipeEvents = pgTable('recipe_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  cantidad: num('cantidad', 10, 2).notNull().default(1), // unidades producidas
  notas: text('notas'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('recipe_events_unique').on(t.recipeId, t.eventId)]);

// ───────── Ingredientes usados por instancia ─────────
// cantidad_base: gramos, mililitros o unidades según ingredients.unidad_base
// precio_*: TOTAL pagado por esa cantidad. precio_usd = USD a tasa BCV.
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  recipeEventId: integer('recipe_event_id').notNull().references(() => recipeEvents.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  cantidadBase: num('cantidad_base').notNull(),
  precioUsd: num('precio_usd', 14, 2),
  precioUsdt: num('precio_usdt', 14, 2),
  fechaPrecio: date('fecha_precio', { mode: 'string' }),
}, (t) => [index('ri_recipe_event_idx').on(t.recipeEventId), index('ri_ingredient_idx').on(t.ingredientId)]);

// ───────── Media (archivo) + enlaces a instancias ─────────
export const media = pgTable('media', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  url: text('url').notNull(),
  tipo: tipoMedia('tipo').notNull().default('imagen'),
  anio: integer('anio').notNull(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (t) => [index('media_recipe_idx').on(t.recipeId), index('media_anio_idx').on(t.anio)]);

export const mediaLinks = pgTable('media_links', {
  mediaId: integer('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  recipeEventId: integer('recipe_event_id').notNull().references(() => recipeEvents.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.mediaId, t.recipeEventId] })]);

// ───────── Historial de precios ─────────
export const preciosHistoricos = pgTable('precios_historicos', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  cantidadBase: num('cantidad_base').notNull(),
  precioUsd: num('precio_usd', 14, 2),
  precioUsdt: num('precio_usdt', 14, 2),
  fecha: date('fecha', { mode: 'string' }).notNull(),
}, (t) => [
  index('ph_ingredient_fecha_idx').on(t.ingredientId, t.fecha),
  uniqueIndex('ph_dedupe').on(
    t.ingredientId, t.fecha, t.cantidadBase,
    sql`coalesce(${t.precioUsd}, -1)`, sql`coalesce(${t.precioUsdt}, -1)`,
  ),
]);

// ───────── Lista de compras ─────────
export const shoppingLists = pgTable('shopping_lists', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  anio: integer('anio').notNull(),
  nombre: text('nombre').notNull(),
  createdAt: createdAt(),
});

export const shoppingItems = pgTable('shopping_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  listId: integer('list_id').notNull().references(() => shoppingLists.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  cantidadBase: num('cantidad_base').notNull(),
  comprado: boolean('comprado').notNull().default(false),
});
