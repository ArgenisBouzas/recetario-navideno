import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/field';
import { fmtUsd, fmtUsdt } from '@/lib/format';
import { formatCantidad } from '@shared/units';
import type { IngredientSuggestion } from '@/lib/types';
import { useIngredientSearch } from './hooks';

export function referenciaPrecio(s: IngredientSuggestion) {
  const p = s.ultimoPrecio;
  if (!p) return 'Sin precio anterior';
  return `${fmtUsd(p.precioUsd)} · ${fmtUsdt(p.precioUsdt)} por ${formatCantidad(p.cantidadBase, s.unidadBase)} (${p.fecha})`;
}

/** Autocompletado de ingredientes existentes, mostrando el último precio conocido. */
export function IngredientInput({ value, onChange, onPick, ariaLabel }: {
  value: string; onChange: (v: string) => void; onPick: (s: IngredientSuggestion) => void; ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setQ(value.trim()), 200); return () => clearTimeout(t); }, [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const { data } = useIngredientSearch(open ? q : '');

  return (
    <div ref={box} className="relative">
      <Input
        value={value} aria-label={ariaLabel} placeholder="Ingrediente" autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      {open && data && data.length > 0 && (
        <ul role="listbox" className="marco-oro absolute left-0 right-0 top-11 z-30 max-h-64 overflow-y-auto p-1">
          {data.map((s) => (
            <li key={s.id} role="option" aria-selected={false}>
              <button type="button" className="block w-full rounded-md px-3 py-2 text-left hover:bg-line/50"
                onClick={() => { onPick(s); setOpen(false); }}>
                <span className="block text-sm font-medium">{s.nombre}</span>
                <span className="block text-xs text-muted">{referenciaPrecio(s)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
