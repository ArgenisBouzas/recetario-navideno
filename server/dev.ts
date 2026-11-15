import { serve } from '@hono/node-server';
import app from './app';

serve({ fetch: app.fetch, port: 3001 }, (i) => console.log(`API local en http://localhost:${i.port}/api`));
