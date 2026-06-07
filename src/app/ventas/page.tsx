import { supabase } from '@/lib/supabase';
import { ShoppingCart, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import ImportarExcel from '@/components/ImportarExcel';
import MarcarPagadoButton from './MarcarPagadoButton';
import VentaRowActions from './VentaRowActions';

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
        <div className="flex gap-3">
          <ImportarExcel />
          <Link 
            href="/ventas/nueva"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
          >
            <ShoppingCart size={20} />
            Nueva Venta
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
                <th className="p-4 font-medium text-gray-400">N° Factura</th>
                <th className="p-4 font-medium text-gray-400">Estado</th>
                <th className="p-4 font-medium text-gray-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
            {(!ventas || ventas.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay ventas registradas.</td>
              </tr>
            )}
            {ventas?.map((venta) => (
              <tr key={venta.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    {format(new Date(venta.fecha), 'dd/MM/yyyy')}
                  </div>
                </td>
                <td className="p-4 font-medium">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    {venta.clientes?.nombre}
                  </div>
                </td>
                <td className="p-4 text-gray-400">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-500" />
                    {venta.nro_factura || '-'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      venta.estado_pago === 'Pagado' ? 'bg-green-500/20 text-green-400' : 
                      venta.estado_pago === 'Pendiente' ? 'bg-red-500/20 text-red-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {venta.estado_pago || 'Pagado'}
                    </span>
                    {venta.estado_pago === 'Pendiente' && (
                      <MarcarPagadoButton ventaId={venta.id} />
                    )}
                  </div>
                </td>
                <td className="p-4 text-right font-bold text-orange-400">
                  <div className="flex items-center justify-end gap-4">
                    <span>${venta.total?.toLocaleString() || 0}</span>
                    <VentaRowActions venta={venta} />
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
