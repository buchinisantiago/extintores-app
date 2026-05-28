'use client';

import { useState } from 'react';
import { Flame, Plus, Minus, Search } from 'lucide-react';
import { addStockTerminado } from './actions';

type SKU = {
  id: string;
  nombre: string;
  tipo_agente: string;
  capacidad_kg: number;
  precio_recarga: number;
};

type StockData = {
  sku: SKU;
  stock: {
    cantidad: number;
    ultima_actualizacion: string | null;
  };
};

export default function StockTerminadoClient({ initialData }: { initialData: StockData[] }) {
  const [search, setSearch] = useState('');
  const [loadingSku, setLoadingSku] = useState<string | null>(null);

  const filteredData = initialData.filter(d => 
    d.sku.nombre.toLowerCase().includes(search.toLowerCase()) ||
    d.sku.tipo_agente.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = async (sku_id: string, current: number, change: number) => {
    if (current + change < 0) return;
    setLoadingSku(sku_id);
    await addStockTerminado(sku_id, current, change);
    setLoadingSku(null);
  };

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-500" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar extintor..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full lg:w-1/3 bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-orange-500 outline-none transition-colors"
        />
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.map((item) => (
          <div key={item.sku.id} className="glass p-5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
                  <Flame size={24} />
                </div>
                <div>
                  <h3 className="font-bold leading-tight">{item.sku.nombre}</h3>
                  <p className="text-xs text-gray-400 mt-1">{item.sku.tipo_agente}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-4 flex justify-between items-center border border-white/5">
              <span className="text-sm text-gray-400">Stock Actual</span>
              <span className="text-2xl font-black text-white">{item.stock.cantidad}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className="block font-mono mb-1">${item.sku.precio_recarga} / recarga</span>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button 
                  onClick={() => handleUpdate(item.sku.id, item.stock.cantidad, -1)}
                  disabled={item.stock.cantidad <= 0 || loadingSku === item.sku.id}
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {loadingSku === item.sku.id ? '...' : '1'}
                </span>
                <button 
                  onClick={() => handleUpdate(item.sku.id, item.stock.cantidad, 1)}
                  disabled={loadingSku === item.sku.id}
                  className="p-1.5 rounded-md text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 glass rounded-xl">
            No se encontraron productos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}
