const n = (v: number) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
export const fmtUsd = (v: number | null | undefined) => (v == null ? 'sin precio' : `$${n(v)}`);
export const fmtUsdt = (v: number | null | undefined) => (v == null ? 'sin precio' : `${n(v)} USDT`);
export const hoy = () => new Date().toISOString().slice(0, 10);
export const fechaLarga = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
