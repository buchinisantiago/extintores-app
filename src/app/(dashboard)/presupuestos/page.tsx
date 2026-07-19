import { supabase } from '@/lib/supabase';
import { FileText, Calendar, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import PresupuestoRowActions from './PresupuestoRowActions';

export const revalidate = 0;

export default async function PresupuestosPage() {
  const { data: presupuestos } = await supabase
    .from('presupuestos')
    .select('*, clientes(nombre)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Presupuestos</h1>
          <p className="text-gray-400">Gestiona las cotizaciones para clientes.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/presupuestos/nuevo"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
          >
            <Plus size={20} />
            Nuevo Presupuesto
          </Link>
        </div>
      </div>
      
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="p-4 font-medium text-gray-400">Fecha</th>
                <th className="p-4 font-medium text-gray-400">Cliente</th>
                <th className="p-4 font-medium text-gray-400">Validez</th>
                <th className="p-4 font-medium text-gray-400">Estado</th>
                <th className="p-4 font-medium text-gray-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
            {(!presupuestos || presupuestos.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay presupuestos registrados.</td>
              </tr>
            )}
            {presupuestos?.map((presupuesto) => {
              const createdDate = new Date(presupuesto.created_at);
              const expirationDate = new Date(createdDate.getTime() + (presupuesto.validez_dias * 24 * 60 * 60 * 1000));
              const isExpired = presupuesto.estado === 'Pendiente' && expirationDate < new Date();
              const displayState = isExpired ? 'Vencido' : presupuesto.estado;

              return (
              <tr key={presupuesto.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    {format(createdDate, 'dd/MM/yyyy')}
                  </div>
                </td>
                <td className="p-4 font-medium">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    {presupuesto.clientes?.nombre}
                  </div>
                </td>
                <td className="p-4 text-gray-400">
                  {presupuesto.validez_dias} días
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    displayState === 'Aprobado' ? 'bg-green-500/20 text-green-400' : 
                    displayState === 'Rechazado' ? 'bg-red-500/20 text-red-400' : 
                    displayState === 'Vencido' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {displayState}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-red-400">
                  <div className="flex items-center justify-end gap-4">
                    <span>${Number(presupuesto.total).toLocaleString()}</span>
                    {/* Modify row actions to receive displayState */}
                    <PresupuestoRowActions presupuesto={{...presupuesto, estado: displayState}} />
                  </div>
                </td>
              </tr>
            )})}
            </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
