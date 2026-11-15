import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { GoldRule } from '@/components/christmas/Ornaments';
import { Photos } from '@/features/media/Photos';
import { IngredientsEditor } from './IngredientsEditor';
import { useRecipeEvent, useRecipeEventMutations, useTemplateSources } from './hooks';

export function RecipeEventPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const { data: re, isLoading, error } = useRecipeEvent(id);
  const { data: fuentes } = useTemplateSources(id);
  const { update, remove, importTemplate } = useRecipeEventMutations(id);
  const [cantidad, setCantidad] = useState('1');
  const [notas, setNotas] = useState('');
  const [fuente, setFuente] = useState('');
  const [copyPrices, setCopyPrices] = useState(false);
  useEffect(() => { if (re) { setCantidad(String(re.cantidad)); setNotas(re.notas ?? ''); } }, [re]);

  if (isLoading) return <p className="text-muted">Cargando registro…</p>;
  if (error || !re) return <p className="text-rojo" role="alert">{error?.message ?? 'Registro no encontrado'}</p>;

  const cambios = Number(cantidad) !== re.cantidad || notas !== (re.notas ?? '');
  async function usarPlantilla() {
    const msg = re!.ingredientes.length ? 'Esto reemplaza los ingredientes actuales de este registro. ¿Continuar?' : null;
    if (msg && !window.confirm(msg)) return;
    await importTemplate.mutateAsync({ fromRecipeEventId: Number(fuente), copyPrices });
    setFuente('');
  }
  async function borrar() {
    if (!window.confirm(`¿Quitar "${re!.recetaNombre}" de ${re!.eventoNombre} ${re!.anio}? Se borran sus ingredientes y precios de este evento.`)) return;
    await remove.mutateAsync(re!.id);
    nav(`/eventos/${re!.eventId}`);
  }

  return (
    <div className="space-y-8">
      <Link to={`/eventos/${re.eventId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />{re.eventoNombre} {re.anio}</Link>
      <header>
        <h1 className="text-4xl font-bold">{re.recetaNombre}</h1>
        <p className="mt-1 text-muted">{re.eventoNombre} {re.anio} · <Link className="underline hover:text-ink" to={`/recetas/${re.recipeId}`}>ver receta</Link></p>
      </header>

      <section className="marco-oro grid gap-4 p-5 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Field label="Cantidad preparada"><Input type="number" min="0.5" step="0.5" value={cantidad} onChange={(e) => setCantidad(e.target.value)} /></Field>
        <Field label="Notas del registro"><Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Cambios que hiciste, cómo quedó…" /></Field>
        <Button disabled={!cambios || !(Number(cantidad) > 0) || update.isPending} onClick={() => update.mutate({ cantidad: Number(cantidad), notas: notas.trim() || null })}>Guardar</Button>
      </section>

      <GoldRule />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Ingredientes y precios</h2>
        {fuentes && fuentes.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-oro/70 p-4">
            <Field label="Usar receta de un año anterior como plantilla">
              <Select className="w-64" value={fuente} onChange={(e) => setFuente(e.target.value)}>
                <option value="">Elige un año</option>
                {fuentes.map((f) => <option key={f.recipeEventId} value={f.recipeEventId}>{f.anio}, {f.evento} ({f.ingredientes} ingredientes)</option>)}
              </Select>
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={copyPrices} onChange={(e) => setCopyPrices(e.target.checked)} />Copiar también los precios</label>
            <Button variant="outline" disabled={!fuente || importTemplate.isPending} onClick={usarPlantilla}><History className="h-4 w-4" />Importar</Button>
            {importTemplate.error && <p className="w-full text-sm text-rojo" role="alert">{importTemplate.error.message}</p>}
          </div>
        )}
        <IngredientsEditor recipeEventId={re.id} items={re.ingredientes} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Fotos</h2>
        <Photos recipeId={re.recipeId} recipeEventId={re.id} anio={re.anio} imagenes={re.imagenes} />
      </section>

      <div className="border-t border-line pt-6"><Button variant="ghost" className="text-rojo" onClick={borrar}><Trash2 className="h-4 w-4" />Quitar de este evento</Button></div>
    </div>
  );
}
