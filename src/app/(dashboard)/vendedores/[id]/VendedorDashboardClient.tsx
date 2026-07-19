'use client';

import { useState } from 'react';
import { DollarSign, CheckCircle2, AlertCircle, FileText, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteVendedor } from '../actions';

type Venta = {
  id: string;
  total: number;
  estado_pago: string;
  nro_factura: string | null;
  fecha: string;
  metodo_pago: string | null;
  venta_items: { cantidad: number; costo_unitario: number }[];
};

export default function VendedorDashboardClient({ 
  vendedor, 
  ventas 
}: { 
  vendedor: { id: string, nombre: string, email: string | null };
  ventas: Venta[];
}) {
  const router = useRouter();
  const [comisionPorcentaje, setComisionPorcentaje] = useState(10); // Default 10%

  const handleDelete = async () => {
    if (confirm('¿Eliminar definitivamente a este vendedor y todas sus ventas?')) {
      const res = await deleteVendedor(vendedor.id);
      if (res.success) {
        router.push('/vendedores');
      } else {
        alert(res.error);
      }
    }
  };

  const ventasPagadas = ventas.filter(v => v.estado_pago === 'Pagado');
  const ventasPendientes = ventas.filter(v => v.estado_pago === 'Pendiente');

  const totalVendidoPagado = ventasPagadas.reduce((acc, v) => acc + v.total, 0);
  const totalVendidoPendiente = ventasPendientes.reduce((acc, v) => acc + v.total, 0);

  const comisionesAcumuladas = totalVendidoPagado * (comisionPorcentaje / 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleDelete}
          className="bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/50 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Trash2 size={18} />
          Eliminar Vendedor
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle2 size={20} />
            <span className="font-bold">Total Facturado (Cobrado)</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-1">${totalVendidoPagado.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">{ventasPagadas.length} ventas concretadas</p>
        </div>

        <div className="glass p-6 rounded-2xl border-t-4 border-t-amber-500">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertCircle size={20} />
            <span className="font-bold">Facturado (Pendiente Cobro)</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-1">${totalVendidoPendiente.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">{ventasPendientes.length} ventas por cobrar</p>
        </div>

        <div className="glass p-6 rounded-2xl border-t-4 border-t-red-600 bg-red-600/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-500">
              <DollarSign size={20} />
              <span className="font-bold">Comisiones a Liquidar</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 rounded border border-slate-700 px-2 py-0.5">
              <input 
                type="number" 
                value={comisionPorcentaje} 
                onChange={e => setComisionPorcentaje(Number(e.target.value))}
                className="w-10 bg-transparent text-right outline-none text-white text-sm font-bold"
                min="0" max="100"
              />
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>
          <h2 className="text-4xl font-black text-red-500 mb-1">${comisionesAcumuladas.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">Calculado sobre ventas cobradas</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText className="text-red-600" /> Historial de Ventas del Empleado
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="p-4 font-medium text-gray-400">Fecha</th>
                <th className="p-4 font-medium text-gray-400">Comprobante</th>
                <th className="p-4 font-medium text-gray-400">Estado</th>
                <th className="p-4 font-medium text-gray-400 text-right">Total Facturado</th>
                <th className="p-4 font-medium text-gray-400 text-right">Comisión ({comisionPorcentaje}%)</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                    Este vendedor aún no ha registrado ventas.
                  </td>
                </tr>
              ) : (
                ventas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(venta => {
                  const isPagado = venta.estado_pago === 'Pagado';
                  return (
                    <tr key={venta.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-300">
                        {new Date(venta.fecha).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono text-gray-400">
                        {venta.nro_factura || 'Sin Comprobante'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPagado ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {isPagado ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                          {venta.estado_pago}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-white">
                        ${venta.total.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-red-400">
                        {isPagado ? `$${(venta.total * (comisionPorcentaje/100)).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
