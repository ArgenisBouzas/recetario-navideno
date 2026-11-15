import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as s from './schema';

if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
const db = drizzle(neon(process.env.DATABASE_URL), { schema: s });

const plantilla = (titulo: string) =>
  `## ${titulo}\n\n### Ingredientes\n- (se completan al registrar la receta en un evento)\n\n### Preparación\n1. Edita este texto con tu proceso de elaboración.\n2. Puedes usar **markdown**: listas, negritas, títulos.\n`;

const estandar = [
  { nombre: 'Paella', categoria: 'plato_principal', descripcion: 'Paella de la cena navideña.' },
  { nombre: 'Ensalada', categoria: 'ensalada', descripcion: 'Ensalada de la cena navideña.' },
  { nombre: 'Pan de jamón', categoria: 'pan', descripcion: 'Pan de jamón navideño.' },
  { nombre: 'Hallacas', categoria: 'hallaca', descripcion: 'Hallacas de diciembre.' },
] as const;

const ingredientesBase: [string, 'g' | 'ml' | 'unidad', (typeof s.categoriaIngrediente.enumValues)[number]][] = [
  ['Arroz', 'g', 'granos_harinas'], ['Harina de trigo', 'g', 'granos_harinas'], ['Harina de maíz precocida', 'g', 'granos_harinas'],
  ['Carne de res', 'g', 'carnes'], ['Carne de cerdo', 'g', 'carnes'], ['Pollo', 'g', 'carnes'], ['Jamón', 'g', 'carnes'],
  ['Tocineta', 'g', 'carnes'], ['Camarones', 'g', 'pescados_mariscos'], ['Calamares', 'g', 'pescados_mariscos'],
  ['Mejillones', 'g', 'pescados_mariscos'], ['Cebolla', 'g', 'vegetales'], ['Ajo', 'g', 'vegetales'], ['Pimentón', 'g', 'vegetales'],
  ['Tomate', 'g', 'vegetales'], ['Zanahoria', 'g', 'vegetales'], ['Papa', 'g', 'vegetales'], ['Lechuga', 'g', 'vegetales'],
  ['Aguacate', 'unidad', 'vegetales'], ['Pasas', 'g', 'frutas'], ['Aceitunas', 'g', 'condimentos'], ['Alcaparras', 'g', 'condimentos'],
  ['Azafrán', 'g', 'condimentos'], ['Sal', 'g', 'condimentos'], ['Aceite', 'ml', 'otros'], ['Vino', 'ml', 'bebidas'],
  ['Caldo', 'ml', 'bebidas'], ['Levadura', 'g', 'otros'], ['Huevos', 'unidad', 'lacteos'], ['Mantequilla', 'g', 'lacteos'],
  ['Hojas de plátano', 'unidad', 'vegetales'],
];

async function main() {
  for (const r of estandar) {
    const exists = await db.select({ id: s.recipes.id }).from(s.recipes).where(sql`lower(${s.recipes.nombre}) = lower(${r.nombre})`);
    if (!exists.length) await db.insert(s.recipes).values({ ...r, procesoMd: plantilla(r.nombre), esEstandar: true });
  }
  await db.insert(s.ingredients)
    .values(ingredientesBase.map(([nombre, unidadBase, categoria]) => ({ nombre, unidadBase, categoria })))
    .onConflictDoNothing();
  console.log('Seed listo: 4 recetas estándar + catálogo base de ingredientes.');
}
main().catch((e) => { console.error(e); process.exit(1); });
