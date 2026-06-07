import { Settings, ShieldAlert } from 'lucide-react';

export default function AjustesPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ajustes del Sistema</h1>
        <p className="text-gray-400">Configuración general de la plataforma.</p>
      </div>
      
      <div className="glass p-10 rounded-2xl text-center border border-white/5">
        <Settings size={64} className="mx-auto text-gray-600 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Próximamente</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          El módulo de ajustes completos (Notificaciones, Usuarios, y Perfil de Empresa) se habilitará en las próximas fases del desarrollo.
        </p>
      </div>
    </div>
  );
}
