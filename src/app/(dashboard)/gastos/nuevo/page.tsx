'use client';

import { createGasto } from '@/app/actions/gastos';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';

export default function NuevoGastoPage() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      createGasto(formData);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/gastos" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft size={24} className="text-gray-400 hover:text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Gasto</h1>
          <p className="text-gray-400">Registra un nuevo comprobante o salida de dinero.</p>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Fecha</label>
              <input 
                type="date" 
                name="fecha" 
                required 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Monto ($)</label>
              <input 
                type="number" 
                name="monto" 
                step="0.01"
                required 
                placeholder="0.00"
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">N° Comprobante (Opcional)</label>
              <input 
                type="text" 
                name="nro_comprobante" 
                placeholder="Ej. 0001-00001234"
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Estado de Pago</label>
              <select 
                name="estado_pago"
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 appearance-none"
              >
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Observaciones</label>
            <textarea 
              name="observaciones" 
              rows={3}
              placeholder="Detalle del gasto, proveedor, etc."
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
            ></textarea>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button 
              type="submit"
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 btn-animate disabled:opacity-50"
            >
              <Save size={20} />
              {isPending ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
