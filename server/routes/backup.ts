import { Hono } from 'hono';
import { db, schema } from '../db';

export const backupRoute = new Hono();

// Exporta TODA la data como JSON descargable
backupRoute.get('/export', async (c) => {
  const s = schema;
  const [recipes, ingredients, events, recipeEvents, recipeIngredients, media, mediaLinks, preciosHistoricos, shoppingLists, shoppingItems] =
    await Promise.all([
      db.select().from(s.recipes), db.select().from(s.ingredients), db.select().from(s.events),
      db.select().from(s.recipeEvents), db.select().from(s.recipeIngredients), db.select().from(s.media),
      db.select().from(s.mediaLinks), db.select().from(s.preciosHistoricos),
      db.select().from(s.shoppingLists), db.select().from(s.shoppingItems),
    ]);
  const body = {
    app: 'recetario-navideno', version: 1, exportedAt: new Date().toISOString(),
    data: { recipes, ingredients, events, recipeEvents, recipeIngredients, media, mediaLinks, preciosHistoricos, shoppingLists, shoppingItems },
  };
  c.header('Content-Disposition', `attachment; filename="recetario-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  return c.json(body);
});
