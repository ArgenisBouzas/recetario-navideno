import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { CATEGORIA_LABEL, cn } from '@/lib/utils';
import { CATEGORIAS_RECETA } from '@shared/schemas';
import { extractYouTubeId } from '@shared/units';
import { useRecipe, useSaveRecipe } from './hooks';
import { MarkdownView } from './MarkdownView';
import { YouTubeEmbed } from './YouTubeEmbed';

const schema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre de la receta').max(120),
  categoria: z.enum(CATEGORIAS_RECETA),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres'),
  procesoMd: z.string().max(50000),
  videoYoutubeUrl: z.string().refine((v) => !v.trim() || extractYouTubeId(v.trim()) !== null, 'Pega un enlace de YouTube válido'),
  esEstandar: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function RecipeFormPage() {
  const idParam = useParams().id;
  const id = idParam ? Number(idParam) : undefined;
  const nav = useNavigate();
  const { data: existing, isLoading } = useRecipe(id);
  const save = useSaveRecipe(id);
  const [tab, setTab] = useState<'editar' | 'vista'>('editar');

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', categoria: 'plato_principal', descripcion: '', procesoMd: '', videoYoutubeUrl: '', esEstandar: false },
  });

  useEffect(() => {
    if (existing) reset({
      nombre: existing.nombre, categoria: existing.categoria, descripcion: existing.descripcion ?? '',
      procesoMd: existing.procesoMd ?? '', videoYoutubeUrl: existing.videoYoutubeUrl ?? '', esEstandar: existing.esEstandar,
    });
  }, [existing, reset]);

  const proceso = watch('procesoMd');
  const video = watch('videoYoutubeUrl').trim();

  async function onSubmit(v: FormValues) {
    const saved = await save.mutateAsync({
      ...v, descripcion: v.descripcion.trim() || null, procesoMd: v.procesoMd.trim() || null,
      videoYoutubeUrl: v.videoYoutubeUrl.trim() || null,
    });
    nav(`/recetas/${saved.id}`);
  }

  if (id && isLoading) return <p className="text-muted">Cargando receta…</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6">
      <Link to={id ? `/recetas/${id}` : '/recetas'} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />Volver</Link>
      <h1 className="text-3xl font-bold">{id ? 'Editar receta' : 'Nueva receta'}</h1>

      <div className="marco-oro space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
          <Field label="Nombre" error={errors.nombre?.message}><Input {...register('nombre')} placeholder="Pan de jamón" autoFocus /></Field>
          <Field label="Categoría">
            <Select {...register('categoria')}>{CATEGORIAS_RECETA.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}</Select>
          </Field>
        </div>
        <Field label="Descripción" error={errors.descripcion?.message} hint="Una línea que recuerde qué la hace especial.">
          <Textarea rows={2} {...register('descripcion')} />
        </Field>
        <Field label="Video de YouTube" error={errors.videoYoutubeUrl?.message} hint="Opcional. Se muestra incrustado en la receta.">
          <Input type="url" placeholder="https://www.youtube.com/watch?v=…" {...register('videoYoutubeUrl')} />
        </Field>
        {video && extractYouTubeId(video) && <div className="max-w-md"><YouTubeEmbed url={video} /></div>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...register('esEstandar')} />Es una receta fija de cada año</label>
      </div>

      <div className="marco-oro space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Proceso de elaboración</h2>
          <div className="flex rounded-lg border border-line p-0.5 text-sm" role="tablist">
            {(['editar', 'vista'] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={cn('rounded-md px-3 py-1', tab === t ? 'bg-accent text-accent-ink' : 'text-muted')}>{t === 'editar' ? 'Escribir' : 'Vista previa'}</button>
            ))}
          </div>
        </div>
        {tab === 'editar'
          ? <Textarea rows={16} className="font-mono text-[13px]" placeholder={'## Ingredientes\n- …\n\n## Preparación\n1. …'} {...register('procesoMd')} />
          : <div className="min-h-[16rem] rounded-lg border border-line p-4">{proceso.trim() ? <MarkdownView>{proceso}</MarkdownView> : <p className="text-muted">Nada que mostrar todavía.</p>}</div>}
        <p className="text-xs text-muted">Admite markdown: títulos con ##, listas con - o 1., **negritas**.</p>
      </div>

      {save.error && <p className="text-rojo" role="alert">{save.error.message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => nav(-1)}>Cancelar</Button>
        <Button type="submit" disabled={save.isPending || (!!id && !isDirty)}>{save.isPending ? 'Guardando…' : 'Guardar receta'}</Button>
      </div>
    </form>
  );
}
