import { supabase } from '@/lib/supabase';
import { ShoppingCart, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export const revalidate = 0;

export default async function VentasPage() {
  const { data: ventas } = await supabase
    .from('ventas')
    .select('*, clientes(nombre), venta_items(count)')
    .order('fecha', { ascending: false });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Historial de Ventas</h1>
          <p className="text-gray-400">Consulta las ventas realizadas y remitos.</p>
        </div>
        <Link 
          href="/ventas/nueva"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
        >
          <ShoppingCart size={20} />
          Nueva Venta
        </Link>
      </div>
      
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              <th className="p-4 font-medium text-gray-400">Fecha</th>
              <th className="p-4 font-medium text-gray-400">Cliente</th>
              <th className="p-4 font-medium text-gray-400 text-center">Ítems</th>
              <th className="p-4 font-medium text-gray-400 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(!ventas || ventas.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 italic">No hay ventas registradas.</td>
              </tr>
            )}
            {ventas?.map((venta) => (
              <tr key={venta.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm')}
                  </div>
                </td>
                <td className="p-4 font-medium">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    {venta.clientes?.nombre}
                  </div>
                </td>
                <td className="p-4 text-center text-gray-400">
                  {venta.venta_items[0]?.count || 0}
                </td>
                <td className="p-4 text-right font-bold text-orange-400">
                  ${venta.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
