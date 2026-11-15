import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { ImagePlus, Images, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useUi } from '@/store/ui';
import { useMediaLibrary, useMediaMutations } from '@/features/events/hooks';

type Img = { id: number; url: string; anio: number };

export function Photos({ recipeId, recipeEventId, anio, imagenes }: { recipeId: number; recipeEventId: number; anio: number; imagenes: Img[] }) {
  const password = useUi((s) => s.password) ?? '';
  const { register, link, unlink, setDefault } = useMediaMutations();
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  async function subir(files: FileList | null) {
    if (!files?.length) return;
    setSubiendo(true); setError(null);
    try {
      for (const f of Array.from(files)) {
        const blob = await upload(`recetas/${recipeId}/${f.name}`, f, { access: 'public', handleUploadUrl: '/api/media/upload', clientPayload: password });
        await register.mutateAsync({ url: blob.url, anio, recipeId, recipeEventId });
      }
    } catch (e) { setError((e as Error).message || 'No se pudo subir la imagen.'); }
    setSubiendo(false);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => subir(e.target.files)} />
        <Button variant="outline" disabled={subiendo} onClick={() => input.current?.click()}><ImagePlus className="h-4 w-4" />{subiendo ? 'Subiendo…' : 'Subir fotos'}</Button>
        <Button variant="outline" onClick={() => setPicker(true)}><Images className="h-4 w-4" />Elegir de años anteriores</Button>
      </div>
      {error && <p className="text-sm text-rojo" role="alert">{error}</p>}
      {imagenes.length === 0 && <p className="text-sm text-muted">Sin fotos en este registro. Máximo 10 MB por imagen.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {imagenes.map((m) => (
          <li key={m.id} className="group relative overflow-hidden rounded-lg border border-oro/50">
            <img src={m.url} alt={`Foto ${m.anio}`} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1.5">
              <button className="rounded p-1 text-white hover:text-oro" aria-label="Usar como imagen principal de la receta" title="Imagen principal" onClick={() => setDefault.mutate({ recipeId, imagenDefaultId: m.id })}><Star className="h-4 w-4" /></button>
              <button className="rounded p-1 text-white hover:text-rojo" aria-label="Quitar de este registro" title="Quitar" onClick={() => unlink.mutate({ mediaId: m.id, recipeEventId })}><X className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      {setDefault.isSuccess && <p className="text-sm text-muted" role="status">Imagen principal actualizada.</p>}
      {picker && <Picker recipeId={recipeId} usadas={imagenes.map((i) => i.id)} onPick={(mediaId) => link.mutate({ mediaId, recipeEventId })} onClose={() => setPicker(false)} />}
    </div>
  );
}

function Picker({ recipeId, usadas, onPick, onClose }: { recipeId: number; usadas: number[]; onPick: (id: number) => void; onClose: () => void }) {
  const [todas, setTodas] = useState(false);
  const { data, isLoading } = useMediaLibrary(todas ? undefined : recipeId, true);
  const lista = (data ?? []).filter((m) => m.tipo === 'imagen' && !usadas.includes(m.id));
  const porAnio = Object.entries(lista.reduce<Record<number, typeof lista>>((a, m) => ((a[m.anio] ??= []).push(m), a), {})).sort((a, b) => Number(b[0]) - Number(a[0]));

  return (
    <Modal titulo="Fotos de años anteriores" onClose={onClose}>
      <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={todas} onChange={(e) => setTodas(e.target.checked)} />Incluir fotos de otras recetas</label>
      {isLoading && <p className="text-muted">Cargando fotos…</p>}
      {!isLoading && porAnio.length === 0 && <p className="text-muted">No hay fotos disponibles para reutilizar.</p>}
      {porAnio.map(([anio, items]) => (
        <div key={anio} className="mb-4">
          <h3 className="mb-2 text-lg font-medium">{anio}</h3>
          <ul className="grid grid-cols-3 gap-2">
            {items.map((m) => (
              <li key={m.id}><button className="block w-full overflow-hidden rounded-lg border border-line hover:border-oro" aria-label={`Usar foto de ${anio}`} onClick={() => { onPick(m.id); onClose(); }}><img src={m.url} alt="" loading="lazy" className="aspect-square w-full object-cover" /></button></li>
            ))}
          </ul>
        </div>
      ))}
    </Modal>
  );
}
