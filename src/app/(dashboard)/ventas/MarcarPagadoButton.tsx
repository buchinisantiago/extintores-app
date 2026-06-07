'use client';

import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { marcarComoPagado } from './actions';

export default function MarcarPagadoButton({ ventaId }: { ventaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [comprobante, setComprobante] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await marcarComoPagado(ventaId, metodoPago, comprobante);
    setIsOpen(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-2 py-1 rounded-full transition-colors cursor-pointer"
      >
        Marcar Pagado
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Detalles del Cobro</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
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
                <label className="block text-sm font-medium text-gray-400 mb-1">Comprobante o Vuelto (Opcional)</label>
                <input 
                  type="text" 
                  value={comprobante}
                  onChange={e => setComprobante(e.target.value)}
                  placeholder="Ej: Nro Transferencia, Entregó $10000..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : <><CheckCircle2 size={18}/> Confirmar Pago</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
