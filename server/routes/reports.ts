import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { reportQuery } from '../../shared/schemas';

const { recipeIngredients: ri, recipeEvents: re, events, recipes, ingredients } = schema;
export const reportsRoute = new Hono();

type Q = { anio?: number; eventId?: number; recipeId?: number; categoria?: (typeof ingredients.$inferSelect)['categoria'] };
const where = (q: Q) =>
  and(
    q.anio ? eq(events.anio, q.anio) : undefined,
    q.eventId ? eq(events.id, q.eventId) : undefined,
    q.recipeId ? eq(re.recipeId, q.recipeId) : undefined,
    q.categoria ? eq(ingredients.categoria, q.categoria) : undefined,
  );
const sumUsd = sql<number>`coalesce(sum(${ri.precioUsd}), 0)`.mapWith(Number);
const sumUsdt = sql<number>`coalesce(sum(${ri.precioUsdt}), 0)`.mapWith(Number);

// 1) Total gastado en el año (USD BCV y USDT)
reportsRoute.get('/year-total', zValidator('query', reportQuery), async (c) => {
  const q = c.req.valid('query');
  const [row] = await db
    .select({ totalUsd: sumUsd, totalUsdt: sumUsdt })
    .from(ri)
    .innerJoin(re, eq(re.id, ri.recipeEventId))
    .innerJoin(events, eq(events.id, re.eventId))
    .innerJoin(ingredients, eq(ingredients.id, ri.ingredientId))
    .where(where(q));
  return c.json({ anio: q.anio ?? null, ...row });
});

// 2) Gasto por receta, con el detalle de ingredientes de cada una
reportsRoute.get('/by-recipe', zValidator('query', reportQuery), async (c) => {
  const q = c.req.valid('query');
  const [totals, detail] = await Promise.all([
    db
      .select({ recipeId: recipes.id, nombre: recipes.nombre, categoria: recipes.categoria, totalUsd: sumUsd, totalUsdt: sumUsdt })
      .from(ri)
      .innerJoin(re, eq(re.id, ri.recipeEventId))
      .innerJoin(events, eq(events.id, re.eventId))
      .innerJoin(recipes, eq(recipes.id, re.recipeId))
      .innerJoin(ingredients, eq(ingredients.id, ri.ingredientId))
      .where(where(q))
      .groupBy(recipes.id)
      .orderBy(asc(recipes.nombre)),
    db
      .select({
        recipeId: re.recipeId, ingredientId: ingredients.id, nombre: ingredients.nombre,
        categoria: ingredients.categoria, unidadBase: ingredients.unidadBase,
        cantidadBase: sql<number>`sum(${ri.cantidadBase})`.mapWith(Number), totalUsd: sumUsd, totalUsdt: sumUsdt,
      })
      .from(ri)
      .innerJoin(re, eq(re.id, ri.recipeEventId))
      .innerJoin(events, eq(events.id, re.eventId))
      .innerJoin(ingredients, eq(ingredients.id, ri.ingredientId))
      .where(where(q))
      .groupBy(re.recipeId, ingredients.id)
      .orderBy(asc(ingredients.nombre)),
  ]);
  return c.json(totals.map((t) => ({ ...t, ingredientes: detail.filter((d) => d.recipeId === t.recipeId) })));
});

// 3) Compras consolidadas por ingrediente + totales por categoría (cantidades en unidad base)
reportsRoute.get('/purchases', zValidator('query', reportQuery), async (c) => {
  const q = c.req.valid('query');
  const items = await db
    .select({
      ingredientId: ingredients.id, nombre: ingredients.nombre, categoria: ingredients.categoria,
      unidadBase: ingredients.unidadBase,
      cantidadBase: sql<number>`sum(${ri.cantidadBase})`.mapWith(Number), totalUsd: sumUsd, totalUsdt: sumUsdt,
    })
    .from(ri)
    .innerJoin(re, eq(re.id, ri.recipeEventId))
    .innerJoin(events, eq(events.id, re.eventId))
    .innerJoin(ingredients, eq(ingredients.id, ri.ingredientId))
    .where(where(q))
    .groupBy(ingredients.id)
    .orderBy(asc(ingredients.categoria), asc(ingredients.nombre));

  const porCategoria = new Map<string, { categoria: string; totalUsd: number; totalUsdt: number }>();
  for (const i of items) {
    const cur = porCategoria.get(i.categoria) ?? { categoria: i.categoria, totalUsd: 0, totalUsdt: 0 };
    cur.totalUsd += i.totalUsd;
    cur.totalUsdt += i.totalUsdt;
    porCategoria.set(i.categoria, cur);
  }
  return c.json({
    items,
    porCategoria: [...porCategoria.values()],
    totalUsd: items.reduce((s, i) => s + i.totalUsd, 0),
    totalUsdt: items.reduce((s, i) => s + i.totalUsdt, 0),
  });
});

// 4) Unidades producidas: "Pan de jamón: 3 el 24 + 2 el 31 = 5"
reportsRoute.get('/units', zValidator('query', reportQuery.pick({ anio: true, eventId: true, recipeId: true })), async (c) => {
  const q = c.req.valid('query');
  const rows = await db
    .select({
      recipeId: recipes.id, nombre: recipes.nombre, categoria: recipes.categoria,
      eventId: events.id, evento: events.nombre, fecha: events.fecha, anio: events.anio, cantidad: re.cantidad,
    })
    .from(re)
    .innerJoin(events, eq(events.id, re.eventId))
    .innerJoin(recipes, eq(recipes.id, re.recipeId))
    .where(and(
      q.anio ? eq(events.anio, q.anio) : undefined,
      q.eventId ? eq(events.id, q.eventId) : undefined,
      q.recipeId ? eq(re.recipeId, q.recipeId) : undefined,
    ))
    .orderBy(asc(recipes.nombre), asc(events.fecha));

  const map = new Map<number, { recipeId: number; nombre: string; categoria: string; total: number; porEvento: { eventId: number; evento: string; fecha: string; anio: number; cantidad: number }[] }>();
  for (const r of rows) {
    const cur = map.get(r.recipeId) ?? { recipeId: r.recipeId, nombre: r.nombre, categoria: r.categoria, total: 0, porEvento: [] };
    cur.total += r.cantidad;
    cur.porEvento.push({ eventId: r.eventId, evento: r.evento, fecha: r.fecha, anio: r.anio, cantidad: r.cantidad });
    map.set(r.recipeId, cur);
  }
  return c.json([...map.values()]);
});

// 5) Comparativa entre años: gasto total por año y gasto por receta por año
reportsRoute.get('/compare', async (c) => {
  const [porAnio, porReceta] = await Promise.all([
    db.select({ anio: events.anio, totalUsd: sumUsd, totalUsdt: sumUsdt })
      .from(ri).innerJoin(re, eq(re.id, ri.recipeEventId)).innerJoin(events, eq(events.id, re.eventId))
      .groupBy(events.anio).orderBy(asc(events.anio)),
    db.select({ anio: events.anio, recipeId: recipes.id, nombre: recipes.nombre, totalUsd: sumUsd, totalUsdt: sumUsdt })
      .from(ri).innerJoin(re, eq(re.id, ri.recipeEventId)).innerJoin(events, eq(events.id, re.eventId))
      .innerJoin(recipes, eq(recipes.id, re.recipeId))
      .groupBy(events.anio, recipes.id).orderBy(asc(events.anio), asc(recipes.nombre)),
  ]);
  return c.json({ porAnio, porReceta });
});
