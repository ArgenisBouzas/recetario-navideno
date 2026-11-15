import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/field';
import { SnowflakeIcon } from '@/components/christmas/Ornaments';
import { CATEGORIA_LABEL, cn } from '@/lib/utils';
import { CATEGORIAS_RECETA } from '@shared/schemas';
import { useRecipes } from './hooks';

export function RecipesPage() {
  const [categoria, setCategoria] = useState<string>('');
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useRecipes({ categoria: categoria || undefined, q: q.trim() || undefined });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recetas</h1>
          <p className="mt-1 text-sm text-muted">Tu catálogo de platillos navideños.</p>
        </div>
        <Link to="/recetas/nueva" className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:brightness-110">
          <Plus className="h-4 w-4" /> Nueva receta
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
          <Input className="pl-9" placeholder="Buscar receta" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar receta" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          {[['', 'Todas'], ...CATEGORIAS_RECETA.map((c) => [c, CATEGORIA_LABEL[c]])].map(([value, label]) => (
            <button
              key={value} onClick={() => setCategoria(value)} aria-pressed={categoria === value}
              className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors',
                categoria === value ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface hover:border-oro')}
            >{label}</button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-muted">Cargando recetas…</p>}
      {error && <p className="text-rojo" role="alert">{error.message}</p>}
      {data && data.length === 0 && (
        <div className="marco-oro p-10 text-center">
          <p className="font-serif text-xl">Aún no hay recetas con ese filtro.</p>
          <p className="mt-1 text-sm text-muted">Crea una nueva o ejecuta <code>npm run db:seed</code> para cargar las 4 estándar.</p>
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((r) => (
          <li key={r.id}>
            <Link to={`/recetas/${r.id}`} className="marco-oro block overflow-hidden transition-transform hover:-translate-y-0.5">
              <div className="grid aspect-[4/3] place-items-center bg-pino/90 text-oro/60">
                {r.imagenDefaultUrl
                  ? <img src={r.imagenDefaultUrl} alt={r.nombre} loading="lazy" className="h-full w-full object-cover" />
                  : <SnowflakeIcon className="h-12 w-12" />}
              </div>
              <div className="space-y-1 p-4">
                <h2 className="text-lg font-bold leading-tight">{r.nombre}</h2>
                <p className="text-sm text-muted">{CATEGORIA_LABEL[r.categoria]}{r.esEstandar ? ', receta fija' : ''}</p>
                <p className="text-sm">{r.veces === 0 ? 'Sin registros todavía' : `Hecha ${r.veces} ${r.veces === 1 ? 'vez' : 'veces'}, la última en ${r.ultimoAnio}`}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
