import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { asc, desc, eq, ilike, inArray } from 'drizzle-orm';
import { db, schema } from '../db';
import { ingredientInput, CATEGORIAS_INGREDIENTE } from '../../shared/schemas';

const { ingredients, preciosHistoricos } = schema;
export const ingredientsRoute = new Hono();

// Autocompletado: ingredientes + último precio conocido (referencia)
ingredientsRoute.get(
  '/',
  zValidator('query', z.object({
    q: z.string().optional(),
    categoria: z.enum(CATEGORIAS_INGREDIENTE).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(20),
  })),
  async (c) => {
    const { q, categoria, limit } = c.req.valid('query');
    const list = await db
      .select().from(ingredients)
      .where(q ? ilike(ingredients.nombre, `%${q}%`) : categoria ? eq(ingredients.categoria, categoria) : undefined)
      .orderBy(asc(ingredients.nombre)).limit(limit);
    if (!list.length) return c.json([]);
    const last = await db
      .selectDistinctOn([preciosHistoricos.ingredientId], {
        ingredientId: preciosHistoricos.ingredientId, cantidadBase: preciosHistoricos.cantidadBase,
        precioUsd: preciosHistoricos.precioUsd, precioUsdt: preciosHistoricos.precioUsdt, fecha: preciosHistoricos.fecha,
      })
      .from(preciosHistoricos)
      .where(inArray(preciosHistoricos.ingredientId, list.map((i) => i.id)))
      .orderBy(preciosHistoricos.ingredientId, desc(preciosHistoricos.fecha), desc(preciosHistoricos.id));
    const m = new Map(last.map((l) => [l.ingredientId, l]));
    return c.json(list.map((i) => ({ ...i, ultimoPrecio: m.get(i.id) ?? null })));
  },
);

// Historial de precios de un ingrediente (comparar variaciones)
ingredientsRoute.get('/:id{[0-9]+}/prices', async (c) => {
  const rows = await db.select().from(preciosHistoricos)
    .where(eq(preciosHistoricos.ingredientId, Number(c.req.param('id'))))
    .orderBy(desc(preciosHistoricos.fecha));
  return c.json(rows);
});

ingredientsRoute.post('/', zValidator('json', ingredientInput), async (c) => {
  const [row] = await db.insert(ingredients).values(c.req.valid('json')).returning();
  return c.json(row, 201);
});

ingredientsRoute.put('/:id{[0-9]+}', zValidator('json', ingredientInput.partial()), async (c) => {
  const [row] = await db.update(ingredients).set(c.req.valid('json')).where(eq(ingredients.id, Number(c.req.param('id')))).returning();
  if (!row) throw new HTTPException(404, { message: 'No encontrado' });
  return c.json(row);
});

ingredientsRoute.delete('/:id{[0-9]+}', async (c) => {
  const [row] = await db.delete(ingredients).where(eq(ingredients.id, Number(c.req.param('id')))).returning({ id: ingredients.id });
  if (!row) throw new HTTPException(404, { message: 'No encontrado' });
  return c.json({ ok: true });
});
