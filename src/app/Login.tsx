import { useState, type FormEvent } from 'react';
import { Snowfall } from '@/components/christmas/Snowfall';
import { GoldRule } from '@/components/christmas/Ornaments';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useUi } from '@/store/ui';

export function Login() {
  const setPassword = useUi((s) => s.setPassword);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/check', { headers: { 'x-app-password': value } }).catch(() => null);
    setLoading(false);
    if (res?.ok) setPassword(value);
    else setError(res ? 'Contraseña incorrecta.' : 'No se pudo conectar con la API. Revisa que esté en marcha.');
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-pino px-4">
      <Snowfall count={60} />
      <form onSubmit={submit} className="marco-oro relative z-10 w-full max-w-sm space-y-5 p-8 text-ink">
        <h1 className="text-center text-3xl font-bold">Recetario Navideño</h1>
        <GoldRule />
        <Field label="Contraseña" error={error}>
          <Input type="password" value={value} onChange={(e) => setValue(e.target.value)} autoFocus required />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </div>
  );
}
