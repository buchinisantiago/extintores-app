'use client';

import { useState } from 'react';
import { Package, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { addMateriaPrima, updateMateriaPrima, deleteMateriaPrima } from './actions';

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

  return (
    <div className="space-y-6">
      {/* Botón Añadir */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
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
        }} className="glass p-6 rounded-xl border-l-4 border-l-orange-500 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-lg">Registrar Nueva Materia Prima</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del Material</label>
              <input name="material" required placeholder="Ej: Polvo ABC" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cantidad Inicial</label>
              <input name="cantidad" type="number" step="0.01" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unidad</label>
              <select name="unidad" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none">
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="Litros">Litros (L)</option>
                <option value="Unidades">Unidades (Ud)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Alerta Mínima</label>
              <input name="alerta_minimo" type="number" step="0.01" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium">Guardar</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium">Cancelar</button>
          </div>
        </form>
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
                    <div className={`p-2 rounded-lg ${isLowStock ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
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
                          className="w-24 bg-slate-900 border border-orange-500 rounded px-2 py-1 text-sm outline-none text-right"
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
                      onClick={() => {
                        setEditingId(item.id);
                        setEditCantidad(item.cantidad);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="Actualizar Stock">
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
