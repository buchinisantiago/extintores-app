'use client';

import { useState, useMemo } from 'react';
import { Flame, Plus, Minus, Search, X, Save, Clock, FileText, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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

  const { chartData, tableData } = useMemo(() => {
    if (!kardexModalItem || !kardexData.length) return { chartData: [], tableData: [] };
    
    let currentStock = initialData.find(d => d.sku.id === kardexModalItem.id)?.stock.cantidad || 0;
    const points = [];
    const rows = [];
    
    for (let i = 0; i < kardexData.length; i++) {
      const mov = kardexData[i];
      rows.push({
        ...mov,
        stock_resultante: currentStock
      });
      points.unshift({
        fechaStr: new Date(mov.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
        nivel: currentStock,
        movimiento: mov.tipo_movimiento,
        cantidad: mov.cantidad,
        refId: mov.referencia_id
      });
      currentStock -= mov.cantidad;
    }
    
    points.unshift({
      fechaStr: 'Inicio',
      nivel: currentStock,
      movimiento: 'Stock Anterior',
      cantidad: 0,
      refId: null
    });
    
    return { chartData: points, tableData: rows };
  }, [kardexData, kardexModalItem, initialData]);

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

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              <th className="p-4 font-medium text-gray-400">Producto</th>
              <th className="p-4 font-medium text-gray-400">Categoría</th>
              <th className="p-4 font-medium text-gray-400 text-right">Precio Recarga</th>
              <th className="p-4 font-medium text-gray-400 text-center">Stock Actual</th>
              <th className="p-4 font-medium text-gray-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No se encontraron productos que coincidan con la búsqueda.</td>
              </tr>
            )}
            {filteredData.map((item) => {
              const isLowStock = item.stock.cantidad <= 0;
              return (
                <tr key={item.sku.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-medium flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isLowStock ? 'bg-red-500/20 text-red-500' : 'bg-red-600/20 text-red-400'}`}>
                      <Flame size={18} />
                    </div>
                    {item.sku.nombre}
                  </td>
                  <td className="p-4 text-gray-400">
                    {item.sku.tipo_agente || 'Accesorio/Repuesto'}
                  </td>
                  <td className="p-4 text-right font-mono text-gray-400">
                    ${item.sku.precio_recarga}
                  </td>
                  <td className="p-4 text-center font-mono">
                    <span className={`text-lg ${isLowStock ? 'text-red-400 font-bold' : 'text-white'}`}>
                      {item.stock.cantidad}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 mr-2">
                        <button 
                          onClick={() => handleUpdate(item.sku.id, item.stock.cantidad, -1)}
                          disabled={item.stock.cantidad <= 0 || loadingSku === item.sku.id}
                          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                          title="Restar 1"
                        >
                          <Minus size={14} />
                        </button>
                        <button 
                          onClick={() => handleUpdate(item.sku.id, item.stock.cantidad, 1)}
                          disabled={loadingSku === item.sku.id}
                          className="p-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                          title="Sumar 1"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button 
                        onClick={() => handleOpenKardex(item.sku)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Ver Historial (Kardex)">
                        <Clock size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Evolución de Stock: {kardexModalItem.nombre}
              </h3>
              <button onClick={() => setKardexModalItem(null)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-blue-500/20 hover:text-blue-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50 flex flex-col">
              {isLoadingKardex ? (
                <div className="text-center py-20 text-gray-500 flex-1 flex items-center justify-center">Cargando gráfico...</div>
              ) : kardexData.length === 0 ? (
                <div className="text-center py-20 text-gray-500 italic flex-1 flex items-center justify-center">No hay movimientos registrados recientes para este producto.</div>
              ) : (
              <>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <XAxis dataKey="fechaStr" stroke="#94a3b8" tick={{fontSize: 12}} dy={10} minTickGap={30} />
                      <YAxis stroke="#94a3b8" tick={{fontSize: 12}} dx={-10} />
                      <Line 
                        type="stepAfter" 
                        dataKey="nivel" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#1e293b' }}
                        activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 border-t border-slate-700/50 pt-6">
                  <h4 className="font-bold text-lg mb-4 text-white">Detalle de Movimientos</h4>
                  <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-black/20 border-b border-slate-700">
                          <th className="p-3 font-medium text-gray-400">Fecha</th>
                          <th className="p-3 font-medium text-gray-400">Tipo de Movimiento</th>
                          <th className="p-3 font-medium text-gray-400">Cantidad</th>
                          <th className="p-3 font-medium text-gray-400">Observaciones</th>
                          <th className="p-3 font-medium text-gray-400 text-center">Stock Resultante</th>
                          <th className="p-3 font-medium text-gray-400 text-right">Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((mov) => (
                          <tr key={mov.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className="p-3 text-gray-400 whitespace-nowrap">
                              {new Date(mov.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                            </td>
                            <td className="p-3 font-medium text-white">{mov.tipo_movimiento}</td>
                            <td className={`p-3 font-bold ${mov.cantidad > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {mov.cantidad > 0 ? '+' : ''}{mov.cantidad} <span className="text-xs text-gray-500 font-normal">uds</span>
                            </td>
                            <td className="p-3 text-gray-400 text-xs italic">{mov.observaciones || '-'}</td>
                            <td className="p-3 font-mono text-center font-bold text-white bg-slate-900/30">
                              {mov.stock_resultante}
                            </td>
                            <td className="p-3 text-right">
                              {mov.referencia_id && (mov.tipo_movimiento.includes('Venta') || mov.tipo_movimiento.includes('Consumo')) && (
                                <a 
                                  href={`/ventas/${mov.referencia_id}`} 
                                  target="_blank" 
                                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium"
                                >
                                  <FileText size={14} /> Ver Remito
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
            <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900 flex justify-end">
              <button onClick={() => setKardexModalItem(null)} className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-2 rounded-xl transition-colors">Cerrar Gráfico</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
