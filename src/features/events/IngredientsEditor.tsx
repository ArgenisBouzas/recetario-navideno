import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { CATEGORIAS_INGREDIENTE } from '@shared/schemas';
import { UNIDADES_ENTRADA, UNIDADES_POR_BASE, fromBase, type UnidadBase } from '@shared/units';
import { fmtUsd, fmtUsdt, hoy } from '@/lib/format';
import type { IngredienteDetalle } from '@/lib/types';
import { IngredientInput, referenciaPrecio } from './IngredientInput';
import { useRecipeEventMutations } from './hooks';

type Row = {
  key: string; ingredientId?: number; nombre: string; categoria: string; unidadBase?: UnidadBase;
  cantidad: string; unidad: string; precioUsd: string; precioUsdt: string; fechaPrecio: string; referencia?: string;
};
const CAT_LABEL: Record<string, string> = {
  carnes: 'Carnes', pescados_mariscos: 'Pescados y mariscos', vegetales: 'Vegetales', frutas: 'Frutas', lacteos: 'Lácteos',
  granos_harinas: 'Granos y harinas', condimentos: 'Condimentos', bebidas: 'Bebidas', otros: 'Otros',
};
let seq = 0;
const nuevaFila = (): Row => ({ key: `n${seq++}`, nombre: '', categoria: 'otros', cantidad: '', unidad: 'kg', precioUsd: '', precioUsdt: '', fechaPrecio: hoy() });
const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

function aFilas(items: IngredienteDetalle[]): Row[] {
  return items.map((i) => {
    const { cantidad, unidad } = fromBase(i.cantidadBase, i.unidadBase);
    return {
      key: `e${i.id}`, ingredientId: i.ingredientId, nombre: i.nombre, categoria: i.categoria, unidadBase: i.unidadBase,
      cantidad: String(cantidad), unidad, precioUsd: i.precioUsd?.toString() ?? '', precioUsdt: i.precioUsdt?.toString() ?? '',
      fechaPrecio: i.fechaPrecio ?? hoy(),
    };
  });
}

export function IngredientsEditor({ recipeEventId, items }: { recipeEventId: number; items: IngredienteDetalle[] }) {
  const { saveIngredients } = useRecipeEventMutations(recipeEventId);
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setRows(aFilas(items)); setDirty(false); }, [items]);

  const set = (key: string, patch: Partial<Row>) => { setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x))); setDirty(true); setMsg(null); };
  const totalUsd = rows.reduce((s, r) => s + (num(r.precioUsd) ?? 0), 0);
  const totalUsdt = rows.reduce((s, r) => s + (num(r.precioUsdt) ?? 0), 0);

  async function guardar() {
    const validas = rows.filter((r) => r.nombre.trim() && num(r.cantidad) !== null);
    if (validas.length !== rows.filter((r) => r.nombre.trim() || r.cantidad.trim()).length) { setMsg('Cada ingrediente necesita nombre y cantidad.'); return; }
    try {
      await saveIngredients.mutateAsync(validas.map((r) => ({
        ingredientId: r.ingredientId, nombre: r.nombre.trim(), categoria: r.categoria, cantidad: num(r.cantidad), unidad: r.unidad,
        precioUsd: num(r.precioUsd), precioUsdt: num(r.precioUsdt), fechaPrecio: r.fechaPrecio || null,
      })));
      setMsg('Ingredientes guardados.');
    } catch (e) { setMsg((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="text-muted">Aún no hay ingredientes. Agrega el primero o usa una receta de un año anterior como plantilla.</p>}
      <ul className="space-y-3">
        {rows.map((r, idx) => {
          const unidades = r.unidadBase ? UNIDADES_POR_BASE[r.unidadBase] : UNIDADES_ENTRADA;
          return (
            <li key={r.key} className="rounded-xl border border-line bg-surface p-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
                <div className="col-span-2 md:col-span-1">
                  <IngredientInput ariaLabel={`Ingrediente ${idx + 1}`} value={r.nombre}
                    onChange={(v) => set(r.key, { nombre: v, ingredientId: undefined, unidadBase: undefined, referencia: undefined })}
                    onPick={(s) => set(r.key, { nombre: s.nombre, ingredientId: s.id, categoria: s.categoria, unidadBase: s.unidadBase,
                      unidad: UNIDADES_POR_BASE[s.unidadBase][0], referencia: referenciaPrecio(s) })} />
                </div>
                <Input aria-label="Cantidad" inputMode="decimal" placeholder="Cantidad" value={r.cantidad} onChange={(e) => set(r.key, { cantidad: e.target.value })} />
                <Select aria-label="Unidad" value={r.unidad} onChange={(e) => set(r.key, { unidad: e.target.value })}>
                  {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
                </Select>
                <Input aria-label="Precio total en USD (BCV)" inputMode="decimal" placeholder="USD BCV" value={r.precioUsd} onChange={(e) => set(r.key, { precioUsd: e.target.value })} />
                <Input aria-label="Precio total en USDT" inputMode="decimal" placeholder="USDT" value={r.precioUsdt} onChange={(e) => set(r.key, { precioUsdt: e.target.value })} />
                <Button variant="ghost" size="icon" aria-label="Quitar ingrediente" onClick={() => { setRows((x) => x.filter((y) => y.key !== r.key)); setDirty(true); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                {r.referencia && <span>Último precio: {r.referencia}</span>}
                {!r.ingredientId && r.nombre.trim() && (
                  <label className="flex items-center gap-2">Ingrediente nuevo, categoría
                    <Select aria-label="Categoría" className="h-8 w-auto text-xs" value={r.categoria} onChange={(e) => set(r.key, { categoria: e.target.value })}>
                      {CATEGORIAS_INGREDIENTE.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                    </Select>
                  </label>
                )}
                <label className="flex items-center gap-2">Fecha del precio
                  <Input type="date" aria-label="Fecha del precio" className="h-8 w-auto text-xs" value={r.fechaPrecio} onChange={(e) => set(r.key, { fechaPrecio: e.target.value })} />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => { setRows((r) => [...r, nuevaFila()]); setDirty(true); }}><Plus className="h-4 w-4" />Agregar ingrediente</Button>
        <p className="text-sm">Total de la receta: <strong className="font-serif text-lg">{fmtUsd(totalUsd)}</strong> · {fmtUsdt(totalUsdt)}</p>
      </div>
      <div className="flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-muted" role="status">{msg}</span>}
        <Button onClick={guardar} disabled={!dirty || saveIngredients.isPending}>{saveIngredients.isPending ? 'Guardando…' : 'Guardar ingredientes'}</Button>
      </div>
      <p className="text-xs text-muted">Los precios son el total pagado por esa cantidad, no por kilo.</p>
    </div>
  );
}
