'use client';

import { useState } from 'react';
import { Flame, Plus, Minus, Search, X, Save, Clock } from 'lucide-react';
import { addStockTerminado, createSku } from './actions';
import { getHistorialKardex } from '../mp/actions';

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
  const [showModal, setShowModal] = useState(false);
  const [kardexModalItem, setKardexModalItem] = useState<SKU | null>(null);
  const [kardexData, setKardexData] = useState<any[]>([]);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);

  const handleOpenKardex = async (item: SKU) => {
    setKardexModalItem(item);
    setIsLoadingKardex(true);
    const res = await getHistorialKardex(item.id, 'SKU');
    if (res.success) {
      setKardexData(res.data);
    }
    setIsLoadingKardex(false);
  };

  const handleCreateSku = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createSku(formData);
    setShowModal(false);
  };

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
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="relative flex-1 lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar extintor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-red-600 outline-none transition-colors"
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.map((item) => (
          <div key={item.sku.id} className="glass p-5 rounded-xl border border-white/5 hover:border-red-600/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-600/10 text-red-600">
                  <Flame size={24} />
                </div>
                <div>
                  <h3 className="font-bold leading-tight">{item.sku.nombre}</h3>
                  <p className="text-xs text-gray-400 mt-1">{item.sku.tipo_agente || 'Accesorio/Repuesto'}</p>
                </div>
              </div>
              <button 
                onClick={() => handleOpenKardex(item.sku)}
                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Ver Historial"
              >
                <Clock size={18} />
              </button>
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
                  className="p-1.5 rounded-md text-red-400 hover:text-orange-300 hover:bg-red-600/20 disabled:opacity-50 transition-colors"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Nuevo Producto</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSku} className="space-y-4">
              <input type="text" name="nombre" placeholder="Nombre" required className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" />
              <input type="text" name="tipo_agente" placeholder="Categoría" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="capacidad_kg" step="0.1" placeholder="Capacidad" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" />
                <input type="number" name="precio_recarga" step="0.01" placeholder="Precio" required className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-medium">Crear Producto</button>
            </form>
          </div>
        </div>
      )}

      {kardexModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <Clock className="text-blue-500" />
                Historial de Stock: {kardexModalItem.nombre}
              </h3>
              <button onClick={() => setKardexModalItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
              {isLoadingKardex ? <div className="text-center py-10 text-gray-500">Cargando...</div> : kardexData.length === 0 ? <div className="text-center py-10 text-gray-500 italic">Sin movimientos recientes.</div> : (
                <div className="space-y-4">
                  {kardexData.map((mov) => (
                    <div key={mov.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <div>
                        <p className="text-sm font-bold">{mov.tipo_movimiento}</p>
                        <p className="text-xs text-gray-400">{new Date(mov.fecha).toLocaleString()}</p>
                      </div>
                      <span className={`font-bold ${mov.cantidad > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
