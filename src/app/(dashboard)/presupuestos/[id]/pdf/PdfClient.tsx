'use client';

import { format } from 'date-fns';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function PdfClient({ presupuesto, items }: { presupuesto: any, items: any[] }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-200 overflow-y-auto print:bg-white flex flex-col">
      {/* Top Bar for Actions (Hidden in Print) */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden shadow-lg sticky top-0 z-10">
        <Link href="/presupuestos" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Volver a Presupuestos
        </Link>
        <button 
          onClick={() => window.print()}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
        >
          <Printer size={20} /> Imprimir / Guardar PDF
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto w-full my-8 p-[20mm] bg-white text-black shadow-2xl print:my-0 print:p-0 print:w-full print:max-w-none print:shadow-none flex flex-col min-h-[297mm]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-red-600 pb-6 mb-8">
          <div className="w-64">
            <img src="/logo2.jpeg" alt="Menendez" className="w-full h-auto object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-red-600 uppercase mb-2">Presupuesto</h1>
            <p className="text-gray-600 font-bold text-lg">Nº {presupuesto.id.split('-')[0].toUpperCase()}</p>
            <p className="text-gray-500 mt-1">Fecha: {format(new Date(presupuesto.created_at), 'dd/MM/yyyy')}</p>
            <p className="text-gray-500">Validez: {presupuesto.validez_dias} días</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-red-600 mb-2 border-b border-gray-200 pb-1">DATOS DEL CLIENTE</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-bold text-gray-700">Razón Social:</span> {presupuesto.clientes.nombre}</p>
              <p><span className="font-bold text-gray-700">Dirección:</span> {presupuesto.clientes.direccion || '-'}</p>
            </div>
            <div>
              <p><span className="font-bold text-gray-700">Teléfono:</span> {presupuesto.clientes.telefono || '-'}</p>
              <p><span className="font-bold text-gray-700">Email:</span> {presupuesto.clientes.email || '-'}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-600 text-white text-sm">
                <th className="py-2 px-4 font-bold rounded-tl-lg">Descripción del Producto / Servicio</th>
                <th className="py-2 px-4 font-bold text-center">Cant.</th>
                <th className="py-2 px-4 font-bold text-right">Precio Unit.</th>
                <th className="py-2 px-4 font-bold text-right rounded-tr-lg">Subtotal</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800">{item.skus.nombre}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-800">{item.cantidad}</td>
                  <td className="py-3 px-4 text-right text-gray-800">${Number(item.precio_unitario).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">${(item.cantidad * Number(item.precio_unitario)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-1/3 bg-gray-50 rounded-lg p-4 border border-gray-200">
            {items && items.reduce((acc, item) => acc + (item.cantidad * Number(item.precio_unitario)), 0) > Number(presupuesto.total) && (
              <>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                  <span>Subtotal:</span>
                  <span>${items.reduce((acc, item) => acc + (item.cantidad * Number(item.precio_unitario)), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-500 mb-2 border-b border-gray-200 pb-2">
                  <span>Descuento:</span>
                  <span>-${(items.reduce((acc, item) => acc + (item.cantidad * Number(item.precio_unitario)), 0) - Number(presupuesto.total)).toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-xl">
              <span className="font-bold text-gray-700">TOTAL:</span>
              <span className="font-black text-red-600">${Number(presupuesto.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {presupuesto.observaciones && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2">Observaciones Adicionales:</h2>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 border border-gray-200 whitespace-pre-wrap">
              {presupuesto.observaciones}
            </div>
          </div>
        )}

        {/* Legal Footer */}
        <div className="mb-8 text-xs text-gray-500 text-justify border-t border-gray-200 pt-4">
          <span className="font-bold">Validez del presupuesto:</span> El presente presupuesto tiene una validez de 30 días corridos contados a partir de la fecha de emisión. Vencido dicho plazo, los valores podrán ser modificados sin previo aviso.
        </div>

        {/* Footer Signature */}
        <div className="mt-auto pt-24 flex justify-between px-12 text-sm text-center text-gray-500">
          <div className="w-48 border-t border-gray-400 pt-2">Firma Cliente / Aclaración</div>
          <div className="w-48 border-t border-gray-400 pt-2">Firma Menendez Seg. Ind.</div>
        </div>

      </div>
    </div>
  );
}
