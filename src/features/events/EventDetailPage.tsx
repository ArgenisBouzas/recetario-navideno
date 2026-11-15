import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { GoldRule } from '@/components/christmas/Ornaments';
import { CATEGORIA_LABEL } from '@/lib/utils';
import { fechaLarga, fmtUsd, fmtUsdt } from '@/lib/format';
import { useRecipes } from '@/features/recipes/hooks';
import { useEvent, useEventMutations, useRecipeEventMutations } from './hooks';

export function EventDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const { data: ev, isLoading, error } = useEvent(id);
  const { update, remove } = useEventMutations();
  const [notas, setNotas] = useState('');
  const [adding, setAdding] = useState(false);
  useEffect(() => { if (ev) setNotas(ev.notas ?? ''); }, [ev]);

  if (isLoading) return <p className="text-muted">Cargando evento…</p>;
  if (error || !ev) return <p className="text-rojo" role="alert">{error?.message ?? 'Evento no encontrado'}</p>;

  async function borrar() {
    if (!window.confirm(`¿Eliminar "${ev!.nombre} ${ev!.anio}" con todos sus platos e ingredientes?`)) return;
    await remove.mutateAsync(ev!.id);
    nav(`/eventos?anio=${ev!.anio}`);
  }

  return (
    <div className="space-y-8">
      <Link to={`/eventos?anio=${ev.anio}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />Eventos {ev.anio}</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{ev.nombre} {ev.anio}</h1>
          <p className="mt-1 text-muted">{fechaLarga(ev.fecha)}</p>
        </div>
        <div className="marco-oro px-5 py-3 text-right">
          <p className="text-sm text-muted">Gasto del evento</p>
          <p className="font-serif text-xl font-bold">{fmtUsd(ev.totalUsd)}</p>
          <p className="text-sm">{fmtUsdt(ev.totalUsdt)}</p>
        </div>
      </header>
      <GoldRule />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Platos</h2>
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Agregar plato</Button>
        </div>
        {ev.recetas.length === 0 && <p className="text-muted">Todavía no agregaste platos a este evento.</p>}
        <ul className="grid gap-4 sm:grid-cols-2">
          {ev.recetas.map((r) => (
            <li key={r.id}>
              <Link to={`/registros/${r.id}`} className="marco-oro block p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xl font-bold">{r.nombre}</h3>
                  <span className="font-serif text-2xl">×{r.cantidad}</span>
                </div>
                <p className="text-sm text-muted">{CATEGORIA_LABEL[r.categoria]}, {r.ingredientes.length} {r.ingredientes.length === 1 ? 'ingrediente' : 'ingredientes'}</p>
                <p className="mt-3 text-sm">{fmtUsd(r.totalUsd)} · {fmtUsdt(r.totalUsdt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Notas del evento</h2>
        <Textarea rows={5} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Quién vino, qué salió bien, qué cambiarías el próximo año…" />
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={update.isPending || notas === (ev.notas ?? '')} onClick={() => update.mutate({ id: ev.id, notas: notas.trim() || null })}>Guardar notas</Button>
          {update.isSuccess && notas === (ev.notas ?? '') && <span className="text-sm text-muted">Notas guardadas</span>}
        </div>
      </section>

      <div className="border-t border-line pt-6"><Button variant="ghost" className="text-rojo" onClick={borrar}><Trash2 className="h-4 w-4" />Eliminar evento</Button></div>
      {adding && <AddDishModal eventId={ev.id} usados={ev.recetas.map((r) => r.recipeId)} onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddDishModal({ eventId, usados, onClose }: { eventId: number; usados: number[]; onClose: () => void }) {
  const nav = useNavigate();
  const { data: recipes } = useRecipes({});
  const { create } = useRecipeEventMutations();
  const disponibles = (recipes ?? []).filter((r) => !usados.includes(r.id));
  const [recipeId, setRecipeId] = useState('');
  const [cantidad, setCantidad] = useState('1');

  async function add() {
    const row = await create.mutateAsync({ recipeId: Number(recipeId), eventId, cantidad: Number(cantidad) || 1 });
    nav(`/registros/${row.id}`);
  }

  return (
    <Modal titulo="Agregar plato" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Receta" hint={disponibles.length === 0 ? 'Ya agregaste todas tus recetas. Crea una nueva en Recetas.' : undefined}>
          <Select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
            <option value="">Elige una receta</option>
            {disponibles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Cantidad que preparaste" hint="Por ejemplo 3 panes de jamón.">
          <Input type="number" min="0.5" step="0.5" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </Field>
        {create.error && <p className="text-sm text-rojo" role="alert">{create.error.message}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!recipeId || create.isPending} onClick={add}>Agregar y registrar ingredientes</Button>
        </div>
      </div>
    </Modal>
  );
}
