import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { db, schema } from '../db';
import { mediaInput } from '../../shared/schemas';

const { media, mediaLinks } = schema;
export const mediaRoute = new Hono();

// Subida directa desde el navegador a Vercel Blob (sin pasar el archivo por la función).
// Esta ruta es pública para el callback de Blob; el token solo se emite si la contraseña es correcta.
mediaRoute.post('/upload', async (c) => {
  const body = (await c.req.json()) as HandleUploadBody;
  const json = await handleUpload({
    body,
    request: c.req.raw,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      if (!process.env.APP_PASSWORD || clientPayload !== process.env.APP_PASSWORD) {
        throw new Error('No autorizado');
      }
      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
      };
    },
    onUploadCompleted: async () => {},
  });
  return c.json(json);
});

// Lista: por receta, por año, o la biblioteca completa (selector de imágenes de años pasados)
mediaRoute.get(
  '/',
  zValidator('query', z.object({ recipeId: z.coerce.number().int().optional(), anio: z.coerce.number().int().optional() })),
  async (c) => {
    const { recipeId, anio } = c.req.valid('query');
    const rows = await db.select().from(media)
      .where(and(recipeId ? eq(media.recipeId, recipeId) : undefined, anio ? eq(media.anio, anio) : undefined))
      .orderBy(desc(media.anio), desc(media.id));
    return c.json(rows);
  },
);

// Registrar un archivo ya subido (o un video) y opcionalmente enlazarlo a una instancia
mediaRoute.post('/', zValidator('json', mediaInput), async (c) => {
  const { recipeEventId, ...data } = c.req.valid('json');
  const [row] = await db.insert(media).values(data).returning();
  if (recipeEventId) await db.insert(mediaLinks).values({ mediaId: row.id, recipeEventId });
  return c.json(row, 201);
});

// Reutilizar una imagen de otro año en una instancia nueva
mediaRoute.post('/:id{[0-9]+}/link', zValidator('json', z.object({ recipeEventId: z.number().int().positive() })), async (c) => {
  await db.insert(mediaLinks).values({ mediaId: Number(c.req.param('id')), recipeEventId: c.req.valid('json').recipeEventId }).onConflictDoNothing();
  return c.json({ ok: true });
});

mediaRoute.delete('/:id{[0-9]+}/link/:recipeEventId{[0-9]+}', async (c) => {
  await db.delete(mediaLinks).where(and(
    eq(mediaLinks.mediaId, Number(c.req.param('id'))),
    eq(mediaLinks.recipeEventId, Number(c.req.param('recipeEventId'))),
  ));
  return c.json({ ok: true });
});

mediaRoute.delete('/:id{[0-9]+}', async (c) => {
  const [row] = await db.delete(media).where(eq(media.id, Number(c.req.param('id')))).returning();
  if (!row) throw new HTTPException(404, { message: 'No encontrado' });
  if (row.tipo === 'imagen') await del(row.url).catch(() => {});
  return c.json({ ok: true });
});
