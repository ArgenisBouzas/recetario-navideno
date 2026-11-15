import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, CalendarDays, Gift, LayoutDashboard, Menu, Settings, TrendingUp, X } from 'lucide-react';
import { Snowfall } from '@/components/christmas/Snowfall';
import { SnowflakeIcon } from '@/components/christmas/Ornaments';
import { Login } from './Login';
import { useUi } from '@/store/ui';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/recetas', label: 'Recetas', icon: BookOpen },
  { to: '/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/reportes', label: 'Reportes', icon: TrendingUp },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10',
              isActive && 'bg-white/15 text-white ring-1 ring-oro/60')
          }
        >
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-6 text-white">
      <Gift className="h-5 w-5 text-oro" />
      <span className="font-serif text-xl font-bold leading-none">Recetario <span className="font-medium italic text-oro">Navideño</span></span>
    </div>
  );
}

export function Layout() {
  const password = useUi((s) => s.password);
  const [open, setOpen] = useState(false);
  if (!password) return <Login />;

  return (
    <div className="relative min-h-screen">
      <Snowfall />
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-oro/40 bg-sidebar md:flex">
        <Brand />
        <Nav />
        <SnowflakeIcon className="mx-auto mt-auto mb-8 h-10 w-10 text-oro/50" />
      </aside>

      {/* Barra móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-white md:hidden">
        <span className="font-serif text-lg font-bold">Recetario <span className="italic text-oro">Navideño</span></span>
        <button aria-label="Abrir menú" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-white/10"><Menu className="h-5 w-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar">
            <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
            <Brand />
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="relative z-10 px-4 py-8 md:ml-60 md:px-10"><div className="mx-auto max-w-5xl"><Outlet /></div></main>
    </div>
  );
}
