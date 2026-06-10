'use client';

import { useState, useMemo } from 'react';
import { Package, Plus, Trash2, Edit2, AlertCircle, Clock, X, FileText, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { addMateriaPrima, updateMateriaPrima, deleteMateriaPrima, getHistorialKardex } from './actions';

type MP = {
  id: string;
  material: string;
  cantidad: number;
  unidad: string;
  alerta_minimo: number;
};

export default function MateriaPrimaClient({ initialData }: { initialData: MP[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCantidad, setEditCantidad] = useState<number>(0);

  const [kardexModalItem, setKardexModalItem] = useState<MP | null>(null);
  const [kardexData, setKardexData] = useState<any[]>([]);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);

  const handleOpenKardex = async (item: MP) => {
    setKardexModalItem(item);
    setIsLoadingKardex(true);
    const res = await getHistorialKardex(item.id, 'MP');
    if (res.success) {
      setKardexData(res.data);
    }
    setIsLoadingKardex(false);
  };

  const { chartData, tableData } = useMemo(() => {
    if (!kardexModalItem || !kardexData.length) return { chartData: [], tableData: [] };
    
    let currentStock = kardexModalItem.cantidad;
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
  }, [kardexData, kardexModalItem]);

  return (
    <div className="space-y-6">
      {/* Botón Añadir */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
        >
          <Plus size={20} />
          Nuevo Material
        </button>
      </div>

      {/* Formulario Añadir */}
      {isAdding && (
        <form action={async (formData) => {
          await addMateriaPrima(formData);
          setIsAdding(false);
        }} className="glass p-6 rounded-xl border-l-4 border-l-red-600 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-lg">Registrar Nueva Materia Prima</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del Material</label>
              <input name="material" required placeholder="Ej: Polvo ABC" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cantidad Inicial</label>
              <input name="cantidad" type="number" step="0.01" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unidad</label>
              <select name="unidad" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none">
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="Litros">Litros (L)</option>
                <option value="Unidades">Unidades (Ud)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Alerta Mínima</label>
              <input name="alerta_minimo" type="number" step="0.01" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium">Guardar</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium">Cancelar</button>
          </div>
        </form>
      )}

      {/* Modal de Kardex (Historial) */}
      {kardexModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Evolución de Stock: {kardexModalItem.material}
              </h3>
              <button onClick={() => setKardexModalItem(null)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-blue-500/20 hover:text-blue-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50 flex flex-col">
              {isLoadingKardex ? (
                <div className="text-center py-20 text-gray-500 flex-1 flex items-center justify-center">Cargando gráfico...</div>
              ) : kardexData.length === 0 ? (
                <div className="text-center py-20 text-gray-500 italic flex-1 flex items-center justify-center">No hay movimientos registrados recientes para este insumo.</div>
              ) : (
              <>
                <div className="h-[200px] w-full mt-2 shrink-0">
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
                              {mov.cantidad > 0 ? '+' : ''}{mov.cantidad} <span className="text-xs text-gray-500 font-normal">{kardexModalItem.unidad}</span>
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

      {/* Tabla */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              <th className="p-4 font-medium text-gray-400">Material</th>
              <th className="p-4 font-medium text-gray-400 text-right">Cantidad Disponible</th>
              <th className="p-4 font-medium text-gray-400 text-right">Mínimo</th>
              <th className="p-4 font-medium text-gray-400 text-center">Estado</th>
              <th className="p-4 font-medium text-gray-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay materia prima registrada.</td>
              </tr>
            )}
            {initialData.map((item) => {
              const isLowStock = item.cantidad <= item.alerta_minimo;
              return (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-medium flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isLowStock ? 'bg-red-500/20 text-red-500' : 'bg-red-600/20 text-red-400'}`}>
                      <Package size={18} />
                    </div>
                    {item.material}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {editingId === item.id ? (
                      <div className="flex justify-end gap-2">
                        <input 
                          type="number" 
                          step="0.01" 
                          value={editCantidad}
                          onChange={e => setEditCantidad(Number(e.target.value))}
                          className="w-24 bg-slate-900 border border-red-600 rounded px-2 py-1 text-sm outline-none text-right"
                          autoFocus
                        />
                        <button 
                          onClick={async () => {
                            await updateMateriaPrima(item.id, editCantidad);
                            setEditingId(null);
                          }}
                          className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 px-2 rounded text-xs font-bold"
                        >OK</button>
                      </div>
                    ) : (
                      <span className="text-lg">
                        {item.cantidad} <span className="text-sm text-gray-500">{item.unidad}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    {item.alerta_minimo} {item.unidad}
                  </td>
                  <td className="p-4 text-center">
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                        <AlertCircle size={12} /> Bajo Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                        Óptimo
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenKardex(item)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Ver Historial (Kardex)">
                      <Clock size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(item.id);
                        setEditCantidad(item.cantidad);
                      }}
                      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Ajuste Manual">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                        if(confirm('¿Eliminar este material?')) await deleteMateriaPrima(item.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
