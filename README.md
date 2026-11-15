# Recetario Navideño

Histórico anual de las comidas navideñas (24, 31 y hallacas): recetas, cantidades, ingredientes, precios (USD a tasa BCV y USDT), fotos y reportes.

> **Estado:** Módulos 1 (DB + API), 2 (recetas) y 3 (eventos, ingredientes y fotos) listos. Siguientes: reportes y gráficos, lista de compras, PWA y pulido.

## Stack
Hono (Vercel Function única en `/api`) · Drizzle ORM · Neon Postgres · Vercel Blob · Zod · React 18 + Vite + TypeScript + Tailwind v4 + TanStack Query + Zustand + React Hook Form

## Variables de entorno
| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Neon, conexión *pooled* (la usa la API) |
| `DATABASE_URL_UNPOOLED` | Neon, conexión directa (migraciones) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `APP_PASSWORD` | Contraseña de la app (header `x-app-password`) |
| `VITE_APP_NAME` | Nombre mostrado en el frontend |

## Setup paso a paso

### 1. Crear la DB en Neon
1. Entra a https://neon.tech → *New Project* (región cercana, p. ej. US East).
2. En *Connection Details* copia dos cadenas: la **pooled** (`-pooler` en el host) → `DATABASE_URL`, y la **direct** → `DATABASE_URL_UNPOOLED`.

### 2. Configurar Vercel Blob
Se crea después de tener el proyecto en Vercel (paso 4): *Storage → Create → Blob*, conéctalo al proyecto y Vercel agrega `BLOB_READ_WRITE_TOKEN`. Para local: *Settings → Environment Variables* y cópialo a tu `.env`.

### 3. Subir el repo a GitHub
```bash
git init && git add . && git commit -m "Recetario Navideño: módulo 1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/recetario-navideno.git
git push -u origin main
```

### 4. Desplegar en Vercel
1. https://vercel.com/new → importa el repo de GitHub.
2. Framework: *Vite* (build `npm run build`, salida `dist`).
3. En *Environment Variables* agrega `DATABASE_URL`, `APP_PASSWORD` (y `BLOB_READ_WRITE_TOKEN` al conectar Blob).
4. Deploy. `vercel.json` ya redirige `/api/*` a la función y el resto al SPA.
5. Prueba: `https://TU-APP.vercel.app/api/health` → `{"ok":true}`.

### 5. Migraciones y seed
```bash
cp .env.example .env   # rellena los valores
npm install
npm run db:migrate     # aplica db/migrations a Neon
npm run db:seed        # 4 recetas estándar + catálogo base de ingredientes
```
Tras cambiar `db/schema.ts`: `npm run db:generate` y luego `npm run db:migrate`.

## Desarrollo local
En dos terminales:
```bash
npm run dev:api        # API en http://localhost:3001/api
npm run dev            # frontend en http://localhost:5173 (proxy /api -> 3001)
```
Al abrir la app te pide la contraseña (`APP_PASSWORD`). `npm run typecheck` valida frontend y backend.

## Notas de diseño
- Las cantidades se guardan en **unidad base** (g, ml, unidad); `shared/units.ts` convierte y formatea (3800 g → 3,8 kg).
- `precio_usd` y `precio_usdt` son el **total pagado** por esa cantidad, no por kilo. `precio_usd` = USD a tasa BCV.
- Una sola función serverless (Hono) evita el límite de 12 funciones del plan Hobby.

## Endpoints (todos bajo `/api`, header `x-app-password`)
| Recurso | Rutas |
|---|---|
| Recetas | `GET/POST /recipes`, `GET/PUT/DELETE /recipes/:id` |
| Eventos | `GET/POST /events`, `GET /events/years`, `GET/PUT/DELETE /events/:id` |
| Receta en evento | `POST /recipe-events`, `GET/PUT/DELETE /recipe-events/:id`, `PUT /recipe-events/:id/ingredients`, `GET /recipe-events/:id/template-sources`, `POST /recipe-events/:id/import` |
| Ingredientes | `GET /ingredients?q=` (con último precio), `GET /ingredients/:id/prices`, `POST/PUT/DELETE` |
| Media | `POST /media/upload` (token Blob), `GET/POST /media`, `POST /media/:id/link`, `DELETE /media/:id` |
| Reportes | `/reports/year-total`, `/by-recipe`, `/purchases`, `/units`, `/compare` (filtros: `anio`, `eventId`, `recipeId`, `categoria`) |
| Compras | `GET /shopping-lists`, `POST /shopping-lists/generate`, `GET /shopping-lists/:id`, `PATCH /shopping-lists/items/:id` |
| Backup | `GET /backup/export` |
