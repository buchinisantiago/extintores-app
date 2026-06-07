import { Settings, ShieldAlert, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateConfig } from './actions';

export const revalidate = 0;

export default async function AjustesPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  if (role !== 'Gerente') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-gray-400 max-w-md">Solo la Gerencia tiene permisos para modificar la configuración global del sistema.</p>
      </div>
    );
  }

  const { data: config } = await supabase.from('configuracion').select('*').eq('id', 1).single();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ajustes del Sistema</h1>
        <p className="text-gray-400">Configuración general de la plataforma y notificaciones.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border-l-4 border-l-red-600">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Settings size={20} className="text-red-600" />
            Configuración General
          </h2>

          <form action={async (formData) => {
            'use server';
            await updateConfig(formData);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Empresa</label>
              <input 
                name="empresa_nombre" 
                defaultValue={config?.empresa_nombre || 'Menendez'} 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:border-red-600 outline-none" 
              />
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-600" />
                Alertas de Seguridad y Vencimientos
              </h3>
              <p className="text-xs text-gray-400 mb-4">Este correo recibirá las alertas semanales de extintores vencidos y las notificaciones instantáneas cuando un empleado edite o elimine ventas/clientes.</p>
              
              <label className="block text-sm font-medium text-gray-400 mb-1">Email de Gerencia</label>
              <input 
                name="email_notificaciones" 
                type="email"
                defaultValue={config?.email_notificaciones || 'gerencia@tuempresa.com'} 
                required 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:border-red-600 outline-none" 
              />
            </div>

            <div className="pt-6">
              <button type="submit" className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Save size={18} />
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
