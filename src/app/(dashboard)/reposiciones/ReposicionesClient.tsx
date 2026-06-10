'use client';

import { useState } from 'react';
import { Plus, Package, FileText, Trash2, X, FileBox, ArchiveRestore, Info } from 'lucide-react';
import { registrarReposicion } from './actions';

type ReposicionItem = {
  id: string;
  tipo_entidad: 'MP' | 'SKU';
  entidad_id: string;
  cantidad: number;
};

type Reposicion = {
  id: string;
  fecha: string;
  observaciones: string;
  reposicion_items: ReposicionItem[];
};

type ItemOption = { id: string, name: string, unit?: string };

export default function ReposicionesClient({ 
  initialData, 
  materiasPrimas, 
  skus 
}: { 
  initialData: Reposicion[], 
  materiasPrimas: { id: string, material: string, unidad: string }[],
  skus: { id: string, nombre: string }[] 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<Array<{tipo: 'MP'|'SKU', id: string, cantidad: number}>>([
    { tipo: 'MP', id: '', cantidad: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to get name of item for historical display
  const getItemName = (tipo: string, id: string) => {
    if (tipo === 'MP') {
      const mp = materiasPrimas.find(m => m.id === id);
      return mp ? `${mp.material} (${mp.unidad})` : 'Materia Prima Desconocida';
    } else {
      const sku = skus.find(s => s.id === id);
      return sku ? sku.nombre : 'Producto Desconocido';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    const validItems = items.filter(i => i.id !== '' && i.cantidad > 0);
    if (validItems.length === 0) {
      alert("Debes añadir al menos un producto o materia prima válido.");
      return;
    }

    setIsSubmitting(true);
    const apiItems = validItems.map(i => ({
      tipo_entidad: i.tipo,
      entidad_id: i.id,
      cantidad: i.cantidad
    }));

    const res = await registrarReposicion(observaciones, apiItems);
    setIsSubmitting(false);

    if (res.success) {
      setIsAdding(false);
      setItems([{ tipo: 'MP', id: '', cantidad: 1 }]);
      setObservaciones('');
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 btn-animate"
        >
          <ArchiveRestore size={20} />
          Nueva Entrada de Stock
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <ArchiveRestore className="text-red-500" />
                Registrar Entrada de Mercadería
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
              <div className="p-6 space-y-6 flex-1">
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-400">
                  <Info className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm">Agrega todos los productos e insumos que llegaron en este pedido. Al guardar, se sumarán automáticamente a sus respectivos stocks.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-300">Ítems que Ingresan</h4>
                    <button 
                      type="button"
                      onClick={() => setItems([...items, { tipo: 'MP', id: '', cantidad: 1 }])}
                      className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus size={16} /> Añadir Fila
                    </button>
                  </div>
                  
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-xl border border-white/5">
                      <div className="w-40 shrink-0">
                        <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                        <select 
                          value={item.tipo}
                          onChange={e => {
                            const newItems = [...items];
                            newItems[index].tipo = e.target.value as 'MP' | 'SKU';
                            newItems[index].id = ''; // reset selection
                            setItems(newItems);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none text-white"
                        >
                          <option value="MP">Materia Prima</option>
                          <option value="SKU">Prod. Terminado</option>
                        </select>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">
                          {item.tipo === 'MP' ? 'Seleccionar Insumo' : 'Seleccionar Producto'}
                        </label>
                        <select 
                          value={item.id}
                          onChange={e => {
                            const newItems = [...items];
                            newItems[index].id = e.target.value;
                            setItems(newItems);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none text-white"
                          required
                        >
                          <option value="">Seleccionar...</option>
                          {item.tipo === 'MP' 
                            ? materiasPrimas.map(mp => <option key={mp.id} value={mp.id}>{mp.material} ({mp.unidad})</option>)
                            : skus.map(sku => <option key={sku.id} value={sku.id}>{sku.nombre}</option>)
                          }
                        </select>
                      </div>

                      <div className="w-24 shrink-0">
                        <label className="block text-xs text-gray-400 mb-1">Cantidad</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0.01"
                          required
                          value={item.cantidad || ''}
                          onChange={e => {
                            const newItems = [...items];
                            newItems[index].cantidad = Number(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none text-white text-right"
                        />
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (items.length > 1) {
                            setItems(items.filter((_, i) => i !== index));
                          }
                        }}
                        className={`mt-6 p-2 rounded-lg transition-colors ${items.length > 1 ? 'text-gray-500 hover:bg-red-500/10 hover:text-red-500' : 'text-slate-700 cursor-not-allowed'}`}
                        disabled={items.length <= 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observaciones / Referencia (Opcional)</label>
                  <textarea 
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    placeholder="Ej: Remito N° 1234 de Proveedor X, ingreso por ajuste de inventario..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white resize-none h-24" 
                  />
                </div>

              </div>

              <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/50 flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center">
                  {isSubmitting ? 'Guardando...' : 'Confirmar Ingreso de Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              <th className="p-4 font-medium text-gray-400 w-48">Fecha / Hora</th>
              <th className="p-4 font-medium text-gray-400">Detalle de Ingreso</th>
              <th className="p-4 font-medium text-gray-400">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {initialData.length === 0 && (
              <tr>
                <td colSpan={3} className="p-12 text-center text-gray-500 italic">
                  <div className="flex flex-col items-center gap-2">
                    <FileBox size={32} className="opacity-20" />
                    No hay ingresos registrados aún.
                  </div>
                </td>
              </tr>
            )}
            {initialData.map((rep) => (
              <tr key={rep.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="p-4 text-gray-400 text-sm">
                  {new Date(rep.fecha).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {rep.reposicion_items.map(item => (
                      <span key={item.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${item.tipo_entidad === 'MP' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {item.tipo_entidad === 'MP' ? <Package size={12} /> : <FileBox size={12} />}
                        {item.cantidad} x {getItemName(item.tipo_entidad, item.entidad_id)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-gray-400 text-sm italic">
                  {rep.observaciones || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
