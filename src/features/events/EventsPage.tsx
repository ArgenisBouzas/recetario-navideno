import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { fechaLarga } from '@/lib/format';
import { useEventMutations, useEvents, useYears } from './hooks';

const PRESETS = [
  { nombre: 'Cena 24', mmdd: '12-24' },
  { nombre: 'Cena 31', mmdd: '12-31' },
  { nombre: 'Hallacas', mmdd: '12-15' },
];

export function EventsPage() {
  const [sp, setSp] = useSearchParams();
  const actual = new Date().getFullYear();
  const anio = Number(sp.get('anio')) || actual;
  const { data: years } = useYears();
  const { data: events, isLoading, error } = useEvents(anio);
  const [open, setOpen] = useState(false);
  const opciones = [...new Set([actual, actual + 1, ...(years ?? [])])].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="mt-1 text-sm text-muted">Las cenas y preparaciones de cada año.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label="Año" className="w-28" value={anio} onChange={(e) => setSp({ anio: e.target.value })}>
            {opciones.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Button onClick={() => setOpen(true)}><CalendarPlus className="h-4 w-4" />Nuevo evento</Button>
        </div>
      </div>

      {isLoading && <p className="text-muted">Cargando eventos…</p>}
      {error && <p className="text-rojo" role="alert">{error.message}</p>}
      {events?.length === 0 && (
        <div className="marco-oro p-10 text-center">
          <p className="font-serif text-xl">No hay eventos en {anio}.</p>
          <p className="mt-1 text-sm text-muted">Crea la Cena 24, la Cena 31 o las hallacas para empezar a registrar.</p>
        </div>
      )}
      <ul className="grid gap-5 sm:grid-cols-2">
        {events?.map((e) => (
          <li key={e.id}>
            <Link to={`/eventos/${e.id}`} className="marco-oro block p-5 transition-transform hover:-translate-y-0.5">
              <h2 className="text-xl font-bold">{e.nombre}</h2>
              <p className="text-sm text-muted">{fechaLarga(e.fecha)}</p>
              <p className="mt-3 text-sm">{e.platos === 0 ? 'Sin platos registrados' : `${e.platos} ${e.platos === 1 ? 'plato' : 'platos'}`}</p>
            </Link>
          </li>
        ))}
      </ul>
      {open && <NewEventModal anio={anio} onClose={() => setOpen(false)} />}
    </div>
  );
}

function NewEventModal({ anio, onClose }: { anio: number; onClose: () => void }) {
  const { create } = useEventMutations();
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: { preset: 'Cena 24', otro: '', fecha: `${anio}-12-24` } });
  const preset = watch('preset');

  async function onSubmit(v: { preset: string; otro: string; fecha: string }) {
    const nombre = v.preset === 'otro' ? v.otro.trim() : v.preset;
    if (!nombre) return;
    await create.mutateAsync({ anio, fecha: v.fecha, nombre });
    onClose();
  }

  return (
    <Modal titulo={`Nuevo evento de ${anio}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Evento">
          <Select {...register('preset', { onChange: (e) => { const p = PRESETS.find((x) => x.nombre === e.target.value); if (p) setValue('fecha', `${anio}-${p.mmdd}`); } })}>
            {PRESETS.map((p) => <option key={p.nombre}>{p.nombre}</option>)}
            <option value="otro">Otra fecha…</option>
          </Select>
        </Field>
        {preset === 'otro' && <Field label="Nombre del evento"><Input {...register('otro')} placeholder="Almuerzo de Año Nuevo" autoFocus /></Field>}
        <Field label="Fecha"><Input type="date" {...register('fecha', { required: true })} /></Field>
        {create.error && <p className="text-sm text-rojo" role="alert">{create.error.message}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={create.isPending}>Crear evento</Button>
        </div>
      </form>
    </Modal>
  );
}
