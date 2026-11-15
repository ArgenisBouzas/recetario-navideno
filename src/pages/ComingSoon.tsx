import { GoldRule } from '@/components/christmas/Ornaments';

export function ComingSoon({ titulo, modulo }: { titulo: string; modulo: string }) {
  return (
    <div className="mx-auto max-w-xl pt-16 text-center">
      <h1 className="text-3xl font-bold">{titulo}</h1>
      <GoldRule className="my-6" />
      <p className="text-muted">Esta sección se construye en el {modulo}.</p>
    </div>
  );
}
