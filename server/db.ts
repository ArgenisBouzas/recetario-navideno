import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';

if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
export const db = drizzle(neon(process.env.DATABASE_URL), { schema });
export { schema };
