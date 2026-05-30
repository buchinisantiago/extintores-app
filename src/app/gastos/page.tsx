import { supabase } from '@/lib/supabase';
import { Banknote, Plus, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export const revalidate = 0;

export default async function GastosPage() {
  const { data: gastos, error } = await supabase
    .from('gastos')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error fetching gastos:', error);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Registro de Gastos</h1>
          <p className="text-gray-400">Control de egresos, compras y comprobantes.</p>
        </div>
        <Link 
          href="/gastos/nuevo"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
        >
          <Plus size={20} />
          Nuevo Gasto
        </Link>
      </div>
      
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              <th className="p-4 font-medium text-gray-400">Fecha</th>
              <th className="p-4 font-medium text-gray-400">Comprobante</th>
              <th className="p-4 font-medium text-gray-400">Observaciones</th>
              <th className="p-4 font-medium text-gray-400">Estado</th>
              <th className="p-4 font-medium text-gray-400 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {(!gastos || gastos.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay gastos registrados.</td>
              </tr>
            )}
            {gastos?.map((gasto) => (
              <tr key={gasto.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                  </div>
                </td>
                <td className="p-4 font-medium">
                  {gasto.nro_comprobante || '-'}
                </td>
                <td className="p-4 text-gray-400">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-500" />
                    {gasto.observaciones || '-'}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gasto.estado_pago === 'Pagado' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {gasto.estado_pago}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-gray-200">
                  ${Number(gasto.monto).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
