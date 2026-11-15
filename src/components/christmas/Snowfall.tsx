import { useMemo } from 'react';

/** Copos sutiles de fondo. Se desactivan con prefers-reduced-motion (ver CSS). */
export function Snowfall({ count = 36 }: { count?: number }) {
  const flakes = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const size = 2 + Math.random() * 4;
      return {
        i, size,
        left: Math.random() * 100,
        dx: (Math.random() - 0.5) * 120,
        dur: 12 + Math.random() * 18,
        delay: -Math.random() * 30,
        op: 0.25 + Math.random() * 0.45,
      };
    }),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {flakes.map((f) => (
        <span
          key={f.i}
          className="copo"
          style={{
            left: `${f.left}%`, width: f.size, height: f.size, opacity: f.op,
            animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`,
            ['--dx' as string]: `${f.dx}px`,
            boxShadow: '0 0 3px rgb(201 162 39 / .35)',
          }}
        />
      ))}
    </div>
  );
}
