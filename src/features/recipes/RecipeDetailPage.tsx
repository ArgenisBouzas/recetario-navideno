import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoldRule } from '@/components/christmas/Ornaments';
import { CATEGORIA_LABEL } from '@/lib/utils';
import { useDeleteRecipe, useRecipe } from './hooks';
import { MarkdownView } from './MarkdownView';
import { YouTubeEmbed } from './YouTubeEmbed';

export function RecipeDetailPage() {
  const id = Number(useParams().id);
  const nav = useNavigate();
  const { data: r, isLoading, error } = useRecipe(id);
  const del = useDeleteRecipe();

  if (isLoading) return <p className="text-muted">Cargando receta…</p>;
  if (error || !r) return <p className="text-rojo" role="alert">{error?.message ?? 'Receta no encontrada'}</p>;

  const imagenes = r.galeria.filter((m) => m.tipo === 'imagen');
  const porAnio = Object.entries(
    imagenes.reduce<Record<number, typeof imagenes>>((acc, m) => ((acc[m.anio] ??= []).push(m), acc), {}),
  ).sort((a, b) => Number(b[0]) - Number(a[0]));

  async function remove() {
    const aviso = r!.historial.length
      ? `Esta receta aparece en ${r!.historial.length} registro(s) de eventos y se eliminarán también. ¿Eliminar "${r!.nombre}"?`
      : `¿Eliminar "${r!.nombre}"?`;
    if (!window.confirm(aviso)) return;
    await del.mutateAsync(r!.id);
    nav('/recetas');
  }

  return (
    <article className="space-y-8">
      <Link to="/recetas" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />Recetas</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold leading-tight">{r.nombre}</h1>
          <p className="mt-1 text-muted">{CATEGORIA_LABEL[r.categoria]}{r.esEstandar ? ', receta fija' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/recetas/${r.id}/editar`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-line/40"><Pencil className="h-4 w-4" />Editar</Link>
          <Button variant="danger" onClick={remove} disabled={del.isPending}><Trash2 className="h-4 w-4" />Eliminar</Button>
        </div>
      </header>

      {r.descripcion && <p className="max-w-[68ch] font-serif text-lg italic text-muted">{r.descripcion}</p>}
      <GoldRule />

      {r.videoYoutubeUrl && <section className="max-w-3xl"><YouTubeEmbed url={r.videoYoutubeUrl} /></section>}

      <section>
        <h2 className="mb-2 text-2xl font-bold">Elaboración</h2>
        {r.procesoMd?.trim() ? <MarkdownView>{r.procesoMd}</MarkdownView> : <p className="text-muted">Todavía no escribiste el proceso. Usa Editar para agregarlo.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Galería</h2>
        {porAnio.length === 0 && <p className="text-muted">Aún no hay fotos de esta receta. Súbelas desde el registro de la receta en un evento.</p>}
        {porAnio.map(([anio, items]) => (
          <div key={anio} className="mb-5">
            <h3 className="mb-2 text-lg font-medium">{anio}</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((m) => (
                <li key={m.id} className="overflow-hidden rounded-lg border border-oro/50">
                  <a href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt={`${r.nombre} ${anio}`} loading="lazy" className="aspect-square w-full object-cover" /></a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Historial</h2>
        {r.historial.length === 0
          ? <p className="text-muted">Esta receta todavía no se ha registrado en ningún evento.</p>
          : (
            <ul className="marco-oro divide-y divide-line">
              {r.historial.map((h) => (
                <li key={h.recipeEventId}>
                  <Link to={`/registros/${h.recipeEventId}`} className="flex items-center justify-between px-5 py-3 hover:bg-line/30">
                    <span>{h.evento} {h.anio}</span>
                    <span className="text-muted">{h.cantidad} {h.cantidad === 1 ? 'unidad' : 'unidades'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </section>
    </article>
  );
}
