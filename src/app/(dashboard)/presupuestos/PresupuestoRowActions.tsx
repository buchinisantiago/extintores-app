'use client';

import { FileText, CheckCircle, XCircle, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { rechazarPresupuesto, borrarPresupuesto, convertirPresupuesto } from './actions';
import { useState } from 'react';

export default function PresupuestoRowActions({ presupuesto }: { presupuesto: any }) {
  const router = useRouter();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  
  // Accounting state
  const [nroFactura, setNroFactura] = useState('');
  const [estadoPago, setEstadoPago] = useState('Pagado');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [comprobante, setComprobante] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAprobarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await convertirPresupuesto(
      presupuesto.id, 
      estadoPago, 
      estadoPago === 'Pagado' ? metodoPago : '', 
      estadoPago === 'Pagado' ? comprobante : '',
      nroFactura
    );
    
    if(res.success) {
      alert('Presupuesto aprobado y convertido a Venta');
      setIsApproveModalOpen(false);
      router.push('/ventas');
    } else {
      alert('Error: ' + res.error);
      setIsSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    if(!confirm('¿Marcar como rechazado?')) return;
    await rechazarPresupuesto(presupuesto.id);
  };

  const handleBorrar = async () => {
    if(!confirm('¿Borrar permanentemente este presupuesto?')) return;
    await borrarPresupuesto(presupuesto.id);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1 opacity-80 hover:opacity-100 transition-opacity">
        <a href={`/presupuestos/${presupuesto.id}/pdf`} target="_blank" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Ver PDF">
          <FileText size={16} />
        </a>
        
        {presupuesto.estado === 'Pendiente' && (
          <>
            <button onClick={() => setIsApproveModalOpen(true)} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors" title="Aprobar (A Ventas)">
              <CheckCircle size={16} />
            </button>
            <button onClick={handleRechazar} className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded transition-colors" title="Rechazar">
              <XCircle size={16} />
            </button>
          </>
        )}

        <button onClick={handleBorrar} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Borrar">
          <Trash2 size={16} />
        </button>
      </div>

      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="text-green-500" /> Aprobar Presupuesto
              </h3>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAprobarSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Esto generará una VENTA real y descontará stock automáticamente. Por favor, ingresa los datos contables.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">N° Factura / Remito *</label>
                <input 
                  type="text" 
                  required
                  value={nroFactura}
                  onChange={e => setNroFactura(e.target.value)}
                  placeholder="Ej: F-0001-00001234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Estado de Pago *</label>
                <select 
                  value={estadoPago}
                  onChange={e => setEstadoPago(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white"
                >
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>
              
              {estadoPago === 'Pagado' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Método de Pago *</label>
                    <select 
                      value={metodoPago}
                      onChange={e => setMetodoPago(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="MercadoPago">MercadoPago</option>
                      <option value="Cheque Diferido">Cheque Diferido</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Comprobante (Opcional)</label>
                    <input 
                      type="text" 
                      value={comprobante}
                      onChange={e => setComprobante(e.target.value)}
                      placeholder="Ej: Nro Transferencia"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsApproveModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Aprobando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
