import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { asc, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { shoppingGenerateInput } from '../../shared/schemas';

const { shoppingLists, shoppingItems, ingredients, recipeEvents, events, recipeIngredients } = schema;
export const shoppingRoute = new Hono();

shoppingRoute.get('/', zValidator('query', z.object({ anio: z.coerce.number().int().optional() })), async (c) => {
  const { anio } = c.req.valid('query');
  const q = db.select().from(shoppingLists).orderBy(desc(shoppingLists.createdAt));
  return c.json(await (anio ? q.where(eq(shoppingLists.anio, anio)) : q));
});

shoppingRoute.get('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'));
  const [list] = await db.select().from(shoppingLists).where(eq(shoppingLists.id, id));
  if (!list) throw new HTTPException(404, { message: 'Lista no encontrada' });
  const items = await db
    .select({
      id: shoppingItems.id, ingredientId: ingredients.id, nombre: ingredients.nombre,
      categoria: ingredients.categoria, unidadBase: ingredients.unidadBase,
      cantidadBase: shoppingItems.cantidadBase, comprado: shoppingItems.comprado,
    })
    .from(shoppingItems)
    .innerJoin(ingredients, eq(ingredients.id, shoppingItems.ingredientId))
    .where(eq(shoppingItems.listId, id))
    .orderBy(asc(ingredients.categoria), asc(ingredients.nombre));
  return c.json({ ...list, items });
});

// Genera la lista a partir de lo que planeas hacer: toma la última instancia registrada de cada
// receta y escala sus ingredientes por (cantidad planeada / cantidad de esa instancia).
shoppingRoute.post('/generate', zValidator('json', shoppingGenerateInput), async (c) => {
  const { anio, nombre, plan } = c.req.valid('json');
  const totals = new Map<number, number>();
  const missing: number[] = [];

  for (const p of plan) {
    const [last] = await db
      .select({ id: recipeEvents.id, cantidad: recipeEvents.cantidad })
      .from(recipeEvents)
      .innerJoin(events, eq(events.id, recipeEvents.eventId))
      .where(eq(recipeEvents.recipeId, p.recipeId))
      .orderBy(desc(events.anio), desc(events.fecha), desc(recipeEvents.id))
      .limit(1);
    if (!last) { missing.push(p.recipeId); continue; }
    const factor = p.cantidad / (last.cantidad || 1);
    const ings = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeEventId, last.id));
    for (const i of ings) totals.set(i.ingredientId, (totals.get(i.ingredientId) ?? 0) + i.cantidadBase * factor);
  }

  const [list] = await db.insert(shoppingLists).values({ anio, nombre }).returning();
  if (totals.size) {
    await db.insert(shoppingItems).values(
      [...totals].map(([ingredientId, cantidad]) => ({ listId: list.id, ingredientId, cantidadBase: Math.round(cantidad * 1000) / 1000 })),
    );
  }
  return c.json({ ...list, sinHistorial: missing }, 201);
});

shoppingRoute.patch('/items/:id{[0-9]+}', zValidator('json', z.object({ comprado: z.boolean() })), async (c) => {
  const [row] = await db.update(shoppingItems).set(c.req.valid('json')).where(eq(shoppingItems.id, Number(c.req.param('id')))).returning();
  if (!row) throw new HTTPException(404, { message: 'Ítem no encontrado' });
  return c.json(row);
});

shoppingRoute.delete('/:id{[0-9]+}', async (c) => {
  const [row] = await db.delete(shoppingLists).where(eq(shoppingLists.id, Number(c.req.param('id')))).returning({ id: shoppingLists.id });
  if (!row) throw new HTTPException(404, { message: 'Lista no encontrada' });
  return c.json({ ok: true });
});
