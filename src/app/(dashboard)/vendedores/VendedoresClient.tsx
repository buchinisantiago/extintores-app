'use client';

import { useState } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { addVendedor, deleteVendedor } from './actions';

type Vendedor = {
  id: string;
  nombre: string;
};

export default function VendedoresClient({ initialData }: { initialData: Vendedor[] }) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 btn-animate"
        >
          <Plus size={20} />
          Nuevo Vendedor
        </button>
      </div>

      {isAdding && (
        <form action={async (formData) => {
          const res = await addVendedor(formData);
          if (res && !res.success) {
            alert(res.error);
          } else {
            setIsAdding(false);
          }
        }} className="glass p-6 rounded-xl border-l-4 border-l-blue-500 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-lg">Registrar Nuevo Vendedor</h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-400 mb-1">Nombre Completo *</label>
              <input name="nombre" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-400 mb-1">Correo para Login *</label>
              <input name="email" type="email" required placeholder="vendedor@empresa.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-blue-500 outline-none" />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors h-[42px]">Guardar</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors h-[42px]">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialData.map((vendedor) => (
          <div key={vendedor.id} className="glass p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-lg">{vendedor.nombre}</h3>
            </div>
            <button 
              onClick={async () => {
                if (confirm('¿Eliminar este vendedor?')) {
                  const res = await deleteVendedor(vendedor.id);
                  if (res && !res.success) alert(res.error);
                }
              }}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {initialData.length === 0 && (
          <div className="col-span-full glass p-10 text-center rounded-xl text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>No se encontraron vendedores. Agrega uno para empezar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
