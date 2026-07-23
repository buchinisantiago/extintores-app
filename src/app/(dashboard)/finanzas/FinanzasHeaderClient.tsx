'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Calendar, X } from 'lucide-react';
import { format, subMonths } from 'date-fns';

export default function FinanzasHeaderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentMonth = searchParams.get('mes') || format(new Date(), 'yyyy-MM');
  const [showModal, setShowModal] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Generate last 12 months for the selector
  const months = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, 'yyyy-MM');
  });

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/finanzas?mes=${e.target.value}`);
  };

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate download of dummy file
    const content = `Reporte desde ${desde} hasta ${hasta}\nEn construccion...`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Finanzas_${desde}_a_${hasta}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowModal(false);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Panel de Finanzas</h1>
          <p className="text-gray-400">Resumen contable exclusivo para Gerencia.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
            <Calendar size={18} className="text-gray-400" />
            <select 
              value={currentMonth} 
              onChange={handleMonthChange}
              className="bg-transparent text-white outline-none focus:ring-0 cursor-pointer"
            >
              {months.map(m => (
                <option key={m} value={m} className="bg-slate-900">{m}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Descargar Reporte
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Descargar Reporte</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleDownload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Desde Fecha</label>
                <input 
                  type="date" 
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                  required 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Hasta Fecha</label>
                <input 
                  type="date" 
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                  required 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-medium transition-colors">
                  Descargar CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
