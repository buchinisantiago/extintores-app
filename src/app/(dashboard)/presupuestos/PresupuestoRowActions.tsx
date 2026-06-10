'use client';

import { FileText, CheckCircle, XCircle, Trash2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { rechazarPresupuesto, borrarPresupuesto, convertirPresupuesto } from './actions';
import { useState } from 'react';

export default function PresupuestoRowActions({ presupuesto }: { presupuesto: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleAprobar = async () => {
    if(!confirm('¿Estás seguro de APROBAR este presupuesto? Esto generará una VENTA real y descontará stock.')) return;
    const res = await convertirPresupuesto(presupuesto.id, 'Pendiente', 'Efectivo', '');
    if(res.success) {
      alert('Presupuesto aprobado y convertido a Venta');
      router.push('/ventas');
    } else {
      alert('Error: ' + res.error);
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
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
        <MoreVertical size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 w-48 glass rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
            <a href={`/presupuestos/${presupuesto.id}/pdf`} target="_blank" className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-white">
              <FileText size={16} /> Ver PDF
            </a>
            
            {presupuesto.estado === 'Pendiente' && (
              <>
                <button onClick={handleAprobar} className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-green-400">
                  <CheckCircle size={16} /> Aprobar (A Ventas)
                </button>
                <button onClick={handleRechazar} className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-red-400">
                  <XCircle size={16} /> Rechazar
                </button>
              </>
            )}

            <button onClick={handleBorrar} className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors text-red-500 border-t border-white/5">
              <Trash2 size={16} /> Borrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
