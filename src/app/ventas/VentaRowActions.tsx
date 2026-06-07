'use client';

import { useState } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';
import { anularVenta, updateVentaInfo } from './actions';

type Venta = {
  id: string;
  nro_factura: string | null;
  estado_pago: string;
  observaciones: string | null;
  metodo_pago: string | null;
  comprobante: string | null;
};

export default function VentaRowActions({ venta }: { venta: Venta }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleAnular = async () => {
    if (confirm('¿Estás seguro de que deseas ANULAR esta venta? El stock de los productos vendidos será restaurado. Esta acción no se puede deshacer.')) {
      const res = await anularVenta(venta.id);
      if (res && !res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={`/ventas/${venta.id}`} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Ver Detalle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </a>
        <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Editar Venta">
          <Edit2 size={16} />
        </button>
        <button onClick={handleAnular} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Anular Venta">
          <Trash2 size={16} />
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in text-left">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Editar Venta</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form action={async (formData) => {
              const res = await updateVentaInfo(venta.id, formData);
              if (res.success) {
                setIsEditing(false);
              } else {
                alert(res.error);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">N° Factura / Remito</label>
                <input name="nro_factura" defaultValue={venta.nro_factura || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Estado de Pago</label>
                <select name="estado_pago" defaultValue={venta.estado_pago} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white">
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
                <select name="metodo_pago" defaultValue={venta.metodo_pago || 'Efectivo'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="Cheque Diferido">Cheque Diferido</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Comprobante</label>
                <input name="comprobante" defaultValue={venta.comprobante || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Observaciones</label>
                <textarea name="observaciones" defaultValue={venta.observaciones || ''} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white"></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
