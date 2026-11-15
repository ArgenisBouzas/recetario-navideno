import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import {
  recipeEventInput, recipeEventUpdate, ingredientLinesInput,
} from '../../shared/schemas';
import { toBase } from '../../shared/units';

const { recipeEvents, recipes, events, recipeIngredients, ingredients, preciosHistoricos } = schema;
export const recipeEventsRoute = new Hono();

const today = () => new Date().toISOString().slice(0, 10);

async function copyIngredients(fromId: number, toId: number, copyPrices: boolean) {
  const src = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeEventId, fromId));
  if (!src.length) return 0;
  await db.insert(recipeIngredients).values(
    src.map((s) => ({
      recipeEventId: toId,
      ingredientId: s.ingredientId,
      cantidadBase: s.cantidadBase,
      precioUsd: copyPrices ? s.precioUsd : null,
      precioUsdt: copyPrices ? s.precioUsdt : null,
      fechaPrecio: copyPrices ? s.fechaPrecio : null,
    })),
  );
  return src.length;
}

recipeEventsRoute.post('/', zValidator('json', recipeEventInput), async (c) => {
  const { templateFromRecipeEventId, copyPrices, ...data } = c.req.valid('json');
  const [row] = await db.insert(recipeEvents).values(data).returning();
  if (templateFromRecipeEventId) await copyIngredients(templateFromRecipeEventId, row.id, copyPrices);
  return c.json(row, 201);
});

recipeEventsRoute.get('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'));
  const [re] = await db
    .select({
      id: recipeEvents.id, recipeId: recipes.id, recetaNombre: recipes.nombre, eventId: events.id,
      eventoNombre: events.nombre, anio: events.anio, cantidad: recipeEvents.cantidad, notas: recipeEvents.notas,
    })
    .from(recipeEvents)
    .innerJoin(recipes, eq(recipes.id, recipeEvents.recipeId))
    .innerJoin(events, eq(events.id, recipeEvents.eventId))
    .where(eq(recipeEvents.id, id));
  if (!re) throw new HTTPException(404, { message: 'No encontrado' });
  const items = await db
    .select({
      id: recipeIngredients.id, ingredientId: ingredients.id, nombre: ingredients.nombre,
      categoria: ingredients.categoria, unidadBase: ingredients.unidadBase,
      cantidadBase: recipeIngredients.cantidadBase, precioUsd: recipeIngredients.precioUsd,
      precioUsdt: recipeIngredients.precioUsdt, fechaPrecio: recipeIngredients.fechaPrecio,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId))
    .where(eq(recipeIngredients.recipeEventId, id))
    .orderBy(ingredients.nombre);
  return c.json({ ...re, ingredientes: items });
});

// Instancias anteriores de la misma receta (años pasados) para usar como plantilla
recipeEventsRoute.get('/:id{[0-9]+}/template-sources', async (c) => {
  const id = Number(c.req.param('id'));
  const [cur] = await db
    .select({ recipeId: recipeEvents.recipeId, anio: events.anio })
    .from(recipeEvents).innerJoin(events, eq(events.id, recipeEvents.eventId))
    .where(eq(recipeEvents.id, id));
  if (!cur) throw new HTTPException(404, { message: 'No encontrado' });
  const rows = await db
    .select({
      recipeEventId: recipeEvents.id, anio: events.anio, evento: events.nombre, cantidad: recipeEvents.cantidad,
      ingredientes: sql<number>`(select count(*) from ${recipeIngredients} where ${recipeIngredients.recipeEventId} = ${recipeEvents.id})`.mapWith(Number),
    })
    .from(recipeEvents).innerJoin(events, eq(events.id, recipeEvents.eventId))
    .where(and(eq(recipeEvents.recipeId, cur.recipeId), lt(events.anio, cur.anio)))
    .orderBy(desc(events.anio), desc(events.fecha));
  return c.json(rows.filter((r) => r.ingredientes > 0));
});

// "Usar receta del año X como plantilla": reemplaza los ingredientes actuales
recipeEventsRoute.post(
  '/:id{[0-9]+}/import',
  zValidator('json', z.object({ fromRecipeEventId: z.number().int().positive(), copyPrices: z.boolean().default(false) })),
  async (c) => {
    const id = Number(c.req.param('id'));
    const { fromRecipeEventId, copyPrices } = c.req.valid('json');
    if (fromRecipeEventId === id) throw new HTTPException(400, { message: 'Origen y destino son iguales' });
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeEventId, id));
    const copied = await copyIngredients(fromRecipeEventId, id, copyPrices);
    return c.json({ ok: true, copied });
  },
);

recipeEventsRoute.put('/:id{[0-9]+}', zValidator('json', recipeEventUpdate), async (c) => {
  const [row] = await db.update(recipeEvents).set(c.req.valid('json')).where(eq(recipeEvents.id, Number(c.req.param('id')))).returning();
  if (!row) throw new HTTPException(404, { message: 'No encontrado' });
  return c.json(row);
});

recipeEventsRoute.delete('/:id{[0-9]+}', async (c) => {
  const [row] = await db.delete(recipeEvents).where(eq(recipeEvents.id, Number(c.req.param('id')))).returning({ id: recipeEvents.id });
  if (!row) throw new HTTPException(404, { message: 'No encontrado' });
  return c.json({ ok: true });
});

// Reemplaza TODOS los ingredientes de la instancia. Crea ingredientes nuevos al vuelo
// y registra los precios en el historial (alimenta el "último precio conocido").
recipeEventsRoute.put('/:id{[0-9]+}/ingredients', zValidator('json', ingredientLinesInput), async (c) => {
  const id = Number(c.req.param('id'));
  const [re] = await db.select({ id: recipeEvents.id }).from(recipeEvents).where(eq(recipeEvents.id, id));
  if (!re) throw new HTTPException(404, { message: 'No encontrado' });

  const rows: (typeof recipeIngredients.$inferInsert)[] = [];
  const history: (typeof preciosHistoricos.$inferInsert)[] = [];

  for (const l of c.req.valid('json').items) {
    const { cantidadBase, unidadBase } = toBase(l.cantidad, l.unidad);
    let ing: typeof ingredients.$inferSelect | undefined;
    if (l.ingredientId) {
      [ing] = await db.select().from(ingredients).where(eq(ingredients.id, l.ingredientId));
      if (!ing) throw new HTTPException(400, { message: `Ingrediente ${l.ingredientId} no existe` });
    } else {
      const nombre = l.nombre!.trim();
      [ing] = await db.select().from(ingredients).where(sql`lower(${ingredients.nombre}) = lower(${nombre})`);
      if (!ing) [ing] = await db.insert(ingredients).values({ nombre, unidadBase, categoria: l.categoria }).returning();
    }
    if (ing.unidadBase !== unidadBase) {
      throw new HTTPException(400, { message: `"${ing.nombre}" se mide en ${ing.unidadBase}; usa una unidad compatible` });
    }
    const fecha = l.fechaPrecio ?? today();
    const hasPrice = l.precioUsd != null || l.precioUsdt != null;
    rows.push({
      recipeEventId: id, ingredientId: ing.id, cantidadBase,
      precioUsd: l.precioUsd ?? null, precioUsdt: l.precioUsdt ?? null, fechaPrecio: hasPrice ? fecha : null,
    });
    if (hasPrice && cantidadBase > 0) {
      history.push({ ingredientId: ing.id, cantidadBase, precioUsd: l.precioUsd ?? null, precioUsdt: l.precioUsdt ?? null, fecha });
    }
  }

  const del = db.delete(recipeIngredients).where(eq(recipeIngredients.recipeEventId, id));
  if (rows.length) {
    const ins = db.insert(recipeIngredients).values(rows);
    if (history.length) {
      await db.batch([del, ins, db.insert(preciosHistoricos).values(history).onConflictDoNothing()]);
    } else {
      await db.batch([del, ins]);
    }
  } else {
    await del;
  }
  return c.json({ ok: true, count: rows.length });
});
