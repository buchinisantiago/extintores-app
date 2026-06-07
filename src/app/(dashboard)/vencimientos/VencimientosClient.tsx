'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

type ExtintorExpiring = {
  id: string;
  nro_serie: string;
  fecha_carga: string;
  fecha_vence: string;
  estado: 'vigente' | 'por_vencer' | 'vencido';
  fecha_ph: string | null;
  vence_ph: string | null;
  estado_ph: 'vigente' | 'por_vencer' | 'vencido' | 'sin_datos';
  skus: { nombre: string, tipo_agente: string };
  clientes: { id: string, nombre: string, telefono: string };
};

export default function VencimientosClient({ initialData }: { initialData: ExtintorExpiring[] }) {
  const [filter, setFilter] = useState<'todos' | 'carga' | 'ph'>('todos');

  const filteredData = initialData.filter(ext => {
    if (filter === 'carga') return ext.estado === 'por_vencer' || ext.estado === 'vencido';
    if (filter === 'ph') return ext.estado_ph === 'por_vencer' || ext.estado_ph === 'vencido';
    return true;
  });

  const getWhatsAppLink = (ext: ExtintorExpiring) => {
    if (!ext.clientes?.telefono) return null;
    const phone = ext.clientes.telefono.replace(/\D/g, '');
    let reason = '';
    if (ext.estado === 'vencido' || ext.estado === 'por_vencer') reason += 'la recarga anual';
    if (ext.estado_ph === 'vencido' || ext.estado_ph === 'por_vencer') reason += (reason ? ' y ' : '') + 'la prueba hidráulica';
    
    const message = `Hola ${ext.clientes.nombre}, te avisamos desde FireControl que el extintor ${ext.skus?.nombre} (Serie: ${ext.nro_serie || 'S/N'}) tiene ${reason} próxima a vencer o ya vencida. ¡Comunicate con nosotros para coordinar el retiro!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setFilter('todos')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'todos' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('carga')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'carga' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
        >
          Recargas Anuales
        </button>
        <button 
          onClick={() => setFilter('ph')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'ph' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
        >
          Pruebas Hidráulicas
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5 text-sm">
              <th className="p-4 font-medium text-gray-400">Cliente</th>
              <th className="p-4 font-medium text-gray-400">Extintor</th>
              <th className="p-4 font-medium text-gray-400">Venc. Carga</th>
              <th className="p-4 font-medium text-gray-400">Venc. PH</th>
              <th className="p-4 font-medium text-gray-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay vencimientos próximos. ¡Todo al día!</td>
              </tr>
            )}
            {filteredData.map(ext => {
              const waLink = getWhatsAppLink(ext);
              return (
                <tr key={ext.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <Link href={`/clientes/${ext.clientes?.id}`} className="font-bold hover:text-orange-400 transition-colors">
                      {ext.clientes?.nombre}
                    </Link>
                    <div className="text-xs text-gray-400">{ext.clientes?.telefono || 'Sin teléfono'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-200">{ext.skus?.nombre}</div>
                    <div className="text-xs text-gray-400">Serie: {ext.nro_serie || 'S/N'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        ext.estado === 'vencido' ? 'bg-red-500/20 text-red-400' : 
                        ext.estado === 'por_vencer' ? 'bg-orange-500/20 text-orange-400' : 
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {ext.estado === 'vencido' && <AlertCircle size={12}/>}
                        {ext.estado === 'por_vencer' && <Clock size={12}/>}
                        {ext.estado === 'vigente' && <CheckCircle2 size={12}/>}
                        {format(new Date(ext.fecha_vence), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {ext.vence_ph ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          ext.estado_ph === 'vencido' ? 'bg-red-500/20 text-red-400' : 
                          ext.estado_ph === 'por_vencer' ? 'bg-orange-500/20 text-orange-400' : 
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ext.estado_ph === 'vencido' && <AlertCircle size={12}/>}
                          {ext.estado_ph === 'por_vencer' && <Clock size={12}/>}
                          {ext.estado_ph === 'vigente' && <CheckCircle2 size={12}/>}
                          {format(new Date(ext.vence_ph), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {waLink ? (
                      <a 
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        <MessageCircle size={16} /> Avisar
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500 italic">No hay tel.</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
