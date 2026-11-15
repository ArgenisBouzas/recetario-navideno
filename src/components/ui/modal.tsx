import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="marco-oro relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 text-ink">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold">{titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 hover:bg-line/50"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
