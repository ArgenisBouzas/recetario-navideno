import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { recipesRoute } from './routes/recipes';
import { eventsRoute } from './routes/events';
import { recipeEventsRoute } from './routes/recipe-events';
import { ingredientsRoute } from './routes/ingredients';
import { mediaRoute } from './routes/media';
import { reportsRoute } from './routes/reports';
import { shoppingRoute } from './routes/shopping';
import { backupRoute } from './routes/backup';

const app = new Hono().basePath('/api');

// Auth de un solo usuario: header x-app-password. El upload de Blob se valida dentro de su ruta.
app.use('*', async (c, next) => {
  const open = ['/api/health', '/api/media/upload'];
  if (open.includes(c.req.path)) return next();
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new HTTPException(500, { message: 'APP_PASSWORD no configurada' });
  if (c.req.header('x-app-password') !== expected) throw new HTTPException(401, { message: 'No autorizado' });
  return next();
});

app.get('/health', (c) => c.json({ ok: true }));
app.get('/auth/check', (c) => c.json({ ok: true }));
app.route('/recipes', recipesRoute);
app.route('/events', eventsRoute);
app.route('/recipe-events', recipeEventsRoute);
app.route('/ingredients', ingredientsRoute);
app.route('/media', mediaRoute);
app.route('/reports', reportsRoute);
app.route('/shopping-lists', shoppingRoute);
app.route('/backup', backupRoute);

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  const code = (err as { code?: string; cause?: { code?: string } }).code ?? (err as { cause?: { code?: string } }).cause?.code;
  if (code === '23505') return c.json({ error: 'Ya existe un registro igual' }, 409);
  if (code === '23503') return c.json({ error: 'Está en uso o no existe la referencia' }, 409);
  console.error(err);
  return c.json({ error: 'Error interno' }, 500);
});
app.notFound((c) => c.json({ error: 'No encontrado' }, 404));

export default app;
