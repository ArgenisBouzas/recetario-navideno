import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { eventInput, eventUpdate } from '../../shared/schemas';

const { events, recipeEvents, recipes, recipeIngredients, ingredients, media, mediaLinks } = schema;
export const eventsRoute = new Hono();

// Años con datos (para filtros)
eventsRoute.get('/years', async (c) => {
  const rows = await db.selectDistinct({ anio: events.anio }).from(events).orderBy(desc(events.anio));
  return c.json(rows.map((r) => r.anio));
});

eventsRoute.get('/', zValidator('query', z.object({ anio: z.coerce.number().int().optional() })), async (c) => {
  const { anio } = c.req.valid('query');
  const q = db
    .select({
      id: events.id, anio: events.anio, fecha: events.fecha, nombre: events.nombre,
      platos: sql<number>`count(${recipeEvents.id})`.mapWith(Number),
    })
    .from(events)
    .leftJoin(recipeEvents, eq(recipeEvents.eventId, events.id))
    .groupBy(events.id)
    .orderBy(desc(events.anio), asc(events.fecha));
  return c.json(await (anio ? q.where(eq(events.anio, anio)) : q));
});

// Detalle del evento: platos, ingredientes, totales y fotos
eventsRoute.get('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'));
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) throw new HTTPException(404, { message: 'Evento no encontrado' });

  const res = await db
    .select({
      id: recipeEvents.id, recipeId: recipes.id, nombre: recipes.nombre, categoria: recipes.categoria,
      cantidad: recipeEvents.cantidad, notas: recipeEvents.notas,
    })
    .from(recipeEvents)
    .innerJoin(recipes, eq(recipes.id, recipeEvents.recipeId))
    .where(eq(recipeEvents.eventId, id))
    .orderBy(asc(recipes.nombre));
  const ids = res.map((r) => r.id);

  const [ings, imgs] = ids.length
    ? await Promise.all([
        db
          .select({
            id: recipeIngredients.id, recipeEventId: recipeIngredients.recipeEventId,
            ingredientId: ingredients.id, nombre: ingredients.nombre, categoria: ingredients.categoria,
            unidadBase: ingredients.unidadBase, cantidadBase: recipeIngredients.cantidadBase,
            precioUsd: recipeIngredients.precioUsd, precioUsdt: recipeIngredients.precioUsdt,
            fechaPrecio: recipeIngredients.fechaPrecio,
          })
          .from(recipeIngredients)
          .innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId))
          .where(inArray(recipeIngredients.recipeEventId, ids))
          .orderBy(asc(ingredients.nombre)),
        db
          .select({ recipeEventId: mediaLinks.recipeEventId, id: media.id, url: media.url, tipo: media.tipo, anio: media.anio })
          .from(mediaLinks)
          .innerJoin(media, eq(media.id, mediaLinks.mediaId))
          .where(inArray(mediaLinks.recipeEventId, ids)),
      ])
    : [[], []];

  const recetas = res.map((r) => {
    const items = ings.filter((i) => i.recipeEventId === r.id);
    return {
      ...r,
      ingredientes: items,
      imagenes: imgs.filter((m) => m.recipeEventId === r.id),
      totalUsd: items.reduce((s, i) => s + (i.precioUsd ?? 0), 0),
      totalUsdt: items.reduce((s, i) => s + (i.precioUsdt ?? 0), 0),
    };
  });
  return c.json({
    ...event,
    recetas,
    totalUsd: recetas.reduce((s, r) => s + r.totalUsd, 0),
    totalUsdt: recetas.reduce((s, r) => s + r.totalUsdt, 0),
  });
});

eventsRoute.post('/', zValidator('json', eventInput), async (c) => {
  const [row] = await db.insert(events).values(c.req.valid('json')).returning();
  return c.json(row, 201);
});

eventsRoute.put('/:id{[0-9]+}', zValidator('json', eventUpdate), async (c) => {
  const [row] = await db.update(events).set(c.req.valid('json')).where(eq(events.id, Number(c.req.param('id')))).returning();
  if (!row) throw new HTTPException(404, { message: 'Evento no encontrado' });
  return c.json(row);
});

eventsRoute.delete('/:id{[0-9]+}', async (c) => {
  const [row] = await db.delete(events).where(eq(events.id, Number(c.req.param('id')))).returning({ id: events.id });
  if (!row) throw new HTTPException(404, { message: 'Evento no encontrado' });
  return c.json({ ok: true });
});
