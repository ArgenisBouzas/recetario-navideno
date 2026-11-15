import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { recipeInput, recipeUpdate, CATEGORIAS_RECETA } from '../../shared/schemas';

const { recipes, recipeEvents, events, media } = schema;
export const recipesRoute = new Hono();

// Lista (con filtros) + cuántas veces se ha hecho y último año
recipesRoute.get(
  '/',
  zValidator('query', z.object({ categoria: z.enum(CATEGORIAS_RECETA).optional(), q: z.string().optional() })),
  async (c) => {
    const { categoria, q } = c.req.valid('query');
    const where = and(categoria ? eq(recipes.categoria, categoria) : undefined, q ? ilike(recipes.nombre, `%${q}%`) : undefined);
    const [list, stats, thumbs] = await Promise.all([
      db.select().from(recipes).where(where).orderBy(asc(recipes.nombre)),
      db
        .select({
          recipeId: recipeEvents.recipeId,
          veces: sql<number>`count(*)`.mapWith(Number),
          ultimoAnio: sql<number>`max(${events.anio})`.mapWith(Number),
        })
        .from(recipeEvents)
        .innerJoin(events, eq(events.id, recipeEvents.eventId))
        .groupBy(recipeEvents.recipeId),
      db.select({ id: media.id, url: media.url }).from(media),
    ]);
    const st = new Map(stats.map((s) => [s.recipeId, s]));
    const th = new Map(thumbs.map((t) => [t.id, t.url]));
    return c.json(
      list.map((r) => ({
        ...r,
        imagenDefaultUrl: r.imagenDefaultId ? th.get(r.imagenDefaultId) ?? null : null,
        veces: st.get(r.id)?.veces ?? 0,
        ultimoAnio: st.get(r.id)?.ultimoAnio ?? null,
      })),
    );
  },
);

// Detalle: receta + galería por año + historial de veces que se hizo
recipesRoute.get('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'));
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!recipe) throw new HTTPException(404, { message: 'Receta no encontrada' });
  const [gallery, historial] = await Promise.all([
    db.select().from(media).where(eq(media.recipeId, id)).orderBy(desc(media.anio), desc(media.id)),
    db
      .select({
        recipeEventId: recipeEvents.id,
        anio: events.anio,
        evento: events.nombre,
        fecha: events.fecha,
        cantidad: recipeEvents.cantidad,
      })
      .from(recipeEvents)
      .innerJoin(events, eq(events.id, recipeEvents.eventId))
      .where(eq(recipeEvents.recipeId, id))
      .orderBy(desc(events.anio), desc(events.fecha)),
  ]);
  return c.json({ ...recipe, galeria: gallery, historial });
});

recipesRoute.post('/', zValidator('json', recipeInput), async (c) => {
  const [row] = await db.insert(recipes).values(c.req.valid('json')).returning();
  return c.json(row, 201);
});

recipesRoute.put('/:id{[0-9]+}', zValidator('json', recipeUpdate), async (c) => {
  const id = Number(c.req.param('id'));
  const [row] = await db.update(recipes).set(c.req.valid('json')).where(eq(recipes.id, id)).returning();
  if (!row) throw new HTTPException(404, { message: 'Receta no encontrada' });
  return c.json(row);
});

recipesRoute.delete('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'));
  const [row] = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id });
  if (!row) throw new HTTPException(404, { message: 'Receta no encontrada' });
  return c.json({ ok: true });
});
