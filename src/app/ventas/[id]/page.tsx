import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, User, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtenemos la venta con sus datos
  const { data: venta, error } = await supabase
    .from('ventas')
    .select('*, clientes(nombre, direccion, telefono, email), vendedores(nombre)')
    .eq('id', id)
    .single();

  if (error || !venta) {
    notFound();
  }

  // Obtenemos los ítems de la venta
  const { data: items } = await supabase
    .from('venta_items')
    .select('*, skus(nombre)')
    .eq('venta_id', id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/ventas" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a Ventas
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Detalle de Venta</h1>
            <p className="text-gray-400">Remito y comprobante de operación.</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border ${
            venta.estado_pago === 'Pagado' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className="font-bold">{venta.estado_pago}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl border-t-4 border-t-orange-500 space-y-4">
          <h2 className="text-xl font-bold mb-4">Información del Cliente</h2>
          <div className="flex items-center gap-3 text-gray-300">
            <User className="text-orange-500" size={18} />
            <span className="font-medium text-white">{venta.clientes?.nombre || 'Consumidor Final'}</span>
          </div>
          {venta.clientes?.telefono && (
            <div className="pl-8 text-sm text-gray-400">Tel: {venta.clientes.telefono}</div>
          )}
          {venta.clientes?.direccion && (
            <div className="pl-8 text-sm text-gray-400">Dir: {venta.clientes.direccion}</div>
          )}
        </div>

        <div className="glass p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold mb-4">Datos de la Operación</h2>
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar className="text-gray-500" size={18} />
            <span>Fecha: <span className="text-white">{format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm')}</span></span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <FileText className="text-gray-500" size={18} />
            <span>N° Factura/Remito: <span className="text-white">{venta.nro_factura || 'Sin N°'}</span></span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <ShoppingCart className="text-gray-500" size={18} />
            <span>Vendedor: <span className="text-white">{venta.vendedores?.nombre || 'No asignado'}</span></span>
          </div>
          {venta.metodo_pago && (
            <div className="pl-8 text-sm text-gray-400">Método de pago: {venta.metodo_pago}</div>
          )}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold">Ítems de la Venta</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="p-4 font-medium text-gray-400">Producto / Servicio</th>
                <th className="p-4 font-medium text-gray-400 text-center">Cantidad</th>
                <th className="p-4 font-medium text-gray-400 text-right">Precio Unit.</th>
                <th className="p-4 font-medium text-gray-400 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(!items || items.length === 0) ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 italic">No hay ítems registrados en esta venta.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-gray-300">
                      {item.skus?.nombre || 'Producto Desconocido'}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {item.cantidad}
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      ${(item.precio_unitario || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-medium text-white">
                      ${((item.cantidad || 0) * (item.precio_unitario || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-black/20">
                <td colSpan={3} className="p-4 text-right font-bold text-gray-400">TOTAL</td>
                <td className="p-4 text-right font-black text-orange-400 text-xl">
                  ${(venta.total || 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {venta.observaciones && (
        <div className="glass p-6 rounded-xl">
          <h3 className="font-bold mb-2">Observaciones</h3>
          <p className="text-gray-400">{venta.observaciones}</p>
        </div>
      )}
    </div>
  );
}
