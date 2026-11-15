export const UNIDADES_ENTRADA = ['kg', 'g', 'l', 'ml', 'unidad'] as const;
export type UnidadEntrada = (typeof UNIDADES_ENTRADA)[number];
export type UnidadBase = 'g' | 'ml' | 'unidad';

const MAP: Record<UnidadEntrada, { base: UnidadBase; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  g: { base: 'g', factor: 1 },
  l: { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  unidad: { base: 'unidad', factor: 1 },
};

/** Convierte lo que el usuario escribe (2 kg) a unidad base (2000 g). */
export function toBase(cantidad: number, unidad: UnidadEntrada) {
  const { base, factor } = MAP[unidad];
  return { cantidadBase: Math.round(cantidad * factor * 1000) / 1000, unidadBase: base };
}

const fmt = (n: number, d = 2) =>
  new Intl.NumberFormat('es-VE', { maximumFractionDigits: d }).format(n);

/** 3800 g -> "3,8 kg" · 800 g -> "800 g" · 1500 ml -> "1,5 L" · 6 -> "6 u." */
export function formatCantidad(base: number, unidadBase: UnidadBase): string {
  if (unidadBase === 'g') return base >= 1000 ? `${fmt(base / 1000)} kg` : `${fmt(base, 0)} g`;
  if (unidadBase === 'ml') return base >= 1000 ? `${fmt(base / 1000)} L` : `${fmt(base, 0)} ml`;
  return `${fmt(base)} u.`;
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1) || null;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch { /* URL inválida */ }
  return null;
}

/** Inverso de toBase para mostrar en formularios: 3800 g -> {3.8, 'kg'}. */
export function fromBase(base: number, unidadBase: UnidadBase): { cantidad: number; unidad: UnidadEntrada } {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  if (unidadBase === 'g') return base >= 1000 ? { cantidad: r(base / 1000), unidad: 'kg' } : { cantidad: r(base), unidad: 'g' };
  if (unidadBase === 'ml') return base >= 1000 ? { cantidad: r(base / 1000), unidad: 'l' } : { cantidad: r(base), unidad: 'ml' };
  return { cantidad: r(base), unidad: 'unidad' };
}

export const UNIDADES_POR_BASE: Record<UnidadBase, UnidadEntrada[]> = { g: ['kg', 'g'], ml: ['l', 'ml'], unidad: ['unidad'] };
