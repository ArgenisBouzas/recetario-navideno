import { Download, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUi } from '@/store/ui';

export function SettingsPage() {
  const { theme, toggleTheme, setPassword, password } = useUi();

  async function backup() {
    const res = await fetch('/api/backup/export', { headers: { 'x-app-password': password ?? '' } });
    const blob = await res.blob();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `recetario-backup-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ajustes</h1>
      <div className="marco-oro divide-y divide-line">
        <Row titulo="Modo oscuro" desc="Cambia entre fondo crema y verde pino.">
          <Button variant="outline" onClick={toggleTheme}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === 'dark' ? 'Claro' : 'Oscuro'}</Button>
        </Row>
        <Row titulo="Respaldo de datos" desc="Descarga todo tu recetario en un archivo JSON.">
          <Button variant="outline" onClick={backup}><Download className="h-4 w-4" />Descargar JSON</Button>
        </Row>
        <Row titulo="Sesión" desc="Vuelve a pedir la contraseña en este dispositivo.">
          <Button variant="outline" onClick={() => setPassword(null)}><LogOut className="h-4 w-4" />Cerrar sesión</Button>
        </Row>
      </div>
    </div>
  );
}

function Row({ titulo, desc, children }: { titulo: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-5">
      <div><p className="font-medium">{titulo}</p><p className="text-sm text-muted">{desc}</p></div>
      {children}
    </div>
  );
}
