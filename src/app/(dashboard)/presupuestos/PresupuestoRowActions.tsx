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
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <a href={`/presupuestos/${presupuesto.id}/pdf`} target="_blank" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Ver PDF">
        <FileText size={16} />
      </a>
      
      {presupuesto.estado === 'Pendiente' && (
        <>
          <button onClick={handleAprobar} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors" title="Aprobar (A Ventas)">
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
  );
}
