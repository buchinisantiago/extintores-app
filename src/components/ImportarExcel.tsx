'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X } from 'lucide-react';
import { importarVentasExcel } from '@/app/actions/import';
import { useRouter } from 'next/navigation';

export default function ImportarExcel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Asumiendo que se carga la hoja de "Ventas"
        const wsname = wb.SheetNames.find(n => n.toLowerCase().includes('venta')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws);
        
        const res = await importarVentasExcel(data);
        if (res.success) {
          alert('Importación exitosa. Se añadieron ' + res.count + ' registros.');
          setIsOpen(false);
          router.refresh();
        } else {
          alert('Error en la importación: ' + res.error);
        }
      } catch (error: any) {
        alert('Error al leer el archivo: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors border border-slate-700"
      >
        <Upload size={20} />
        Importar Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Importar Ventas</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-red-600/50 transition-colors bg-slate-900/50">
              <Upload className="mx-auto text-gray-500 mb-4" size={32} />
              <p className="text-sm text-gray-300 mb-4">Sube tu archivo .xlsx con las columnas: <br/> Fecha, N° Factura, Estado, Observaciones, Total</p>
              
              <label className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer inline-block font-medium transition-colors">
                {isProcessing ? 'Procesando...' : 'Seleccionar Archivo'}
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
