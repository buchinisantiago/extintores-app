'use client';

import { useState, useEffect } from 'react';
import { PackageOpen, Plus, Trash2, Edit2, TrendingUp, X, FlaskConical, Beaker } from 'lucide-react';
import { addSku, updateSku, deleteSku, aumentoMasivo, addRecetaItem, removeRecetaItem } from './actions';

type MateriaPrima = {
  id: string;
  material: string;
  unidad: string;
  cantidad: number;
};

type RecetaItem = {
  id: string;
  sku_id: string;
  mp_id: string;
  cantidad_necesaria: number;
  stock_mp: {
    material: string;
    unidad: string;
  };
};

type SKU = {
  id: string;
  nombre: string;
  precio_recarga: number;
  es_servicio: boolean;
  proveedor: string | null;
  costo: number;
};

export default function CatalogoClient({ initialData, materiasPrimas = [], recetas = [] }: { initialData: SKU[], materiasPrimas?: MateriaPrima[], recetas?: RecetaItem[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSku, setEditingSku] = useState<SKU | null>(null);
  const [isAumentoModal, setIsAumentoModal] = useState(false);
  const [recetaModalSku, setRecetaModalSku] = useState<SKU | null>(null);
  const [newRecetaMpId, setNewRecetaMpId] = useState('');
  const [newRecetaCantidad, setNewRecetaCantidad] = useState(1);
  const [isSubmittingReceta, setIsSubmittingReceta] = useState(false);

  const skuRecetas = recetaModalSku ? recetas.filter(r => r.sku_id === recetaModalSku.id) : [];

  const [aumentoData, setAumentoData] = useState({
    porcentaje: 0,
    afectarPrecio: true,
    afectarCosto: true
  });

  const handleAumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`¿Estás seguro de aumentar un ${aumentoData.porcentaje}% a todo el catálogo?`)) return;

    const res = await aumentoMasivo(aumentoData.porcentaje, aumentoData.afectarCosto, aumentoData.afectarPrecio);
    if (res.success) {
      setIsAumentoModal(false);
    } else {
      alert(res.error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAumentoModal(false);
        setIsAdding(false);
        setEditingSku(null);
        setRecetaModalSku(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => setIsAumentoModal(true)}
          className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <TrendingUp size={20} />
          Aumento Masivo %
        </button>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 btn-animate"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {isAdding && (
        <form action={async (formData) => {
          const res = await addSku(formData);
          if (res.success) setIsAdding(false);
          else alert(res.error);
        }} className="glass p-6 rounded-xl border-l-4 border-l-red-600 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-lg">Registrar Nuevo Producto/Servicio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
              <input name="nombre" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-red-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Precio Venta ($) *</label>
              <input name="precio_recarga" type="number" step="0.01" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-red-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Costo Unitario ($)</label>
              <input name="costo" type="number" step="0.01" defaultValue="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-red-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Proveedor</label>
              <input name="proveedor" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-red-600 outline-none" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" name="es_servicio" id="es_servicio" className="w-4 h-4 accent-red-600" />
              <label htmlFor="es_servicio" className="text-sm">Es un Servicio (no lleva stock)</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors">Guardar</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {isAumentoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAumentoModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white text-red-500 flex items-center gap-2"><TrendingUp/> Aumento Masivo (Inflación)</h3>
              <button onClick={() => setIsAumentoModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAumento} className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Aplica un porcentaje de aumento a todo el catálogo a la vez.</p>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Porcentaje de Aumento (%)</label>
                <input type="number" step="0.1" value={aumentoData.porcentaje} onChange={e => setAumentoData({...aumentoData, porcentaje: parseFloat(e.target.value)})} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg font-bold focus:border-red-500 outline-none text-white" />
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={aumentoData.afectarPrecio} onChange={e => setAumentoData({...aumentoData, afectarPrecio: e.target.checked})} className="w-5 h-5 accent-red-500" />
                  <span>Aumentar Precios de Venta</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={aumentoData.afectarCosto} onChange={e => setAumentoData({...aumentoData, afectarCosto: e.target.checked})} className="w-5 h-5 accent-red-500" />
                  <span>Aumentar Costos (Proveedores)</span>
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAumentoModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">Aplicar Aumento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Editar Producto</h3>
              <button onClick={() => setEditingSku(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form action={async (formData) => {
              const res = await updateSku(editingSku.id, formData);
              if (res.success) setEditingSku(null);
              else alert(res.error);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input name="nombre" defaultValue={editingSku.nombre} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Proveedor</label>
                <input name="proveedor" defaultValue={editingSku.proveedor || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Costo ($)</label>
                  <input name="costo" type="number" step="0.01" defaultValue={editingSku.costo} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Precio Venta ($)</label>
                  <input name="precio_recarga" type="number" step="0.01" defaultValue={editingSku.precio_recarga} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingSku(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recetaModalSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                  <FlaskConical className="text-red-500" />
                  Receta / Fórmula
                </h3>
                <p className="text-sm text-gray-400 mt-1">{recetaModalSku.nombre}</p>
              </div>
              <button onClick={() => setRecetaModalSku(null)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <h4 className="font-medium text-sm text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Beaker size={16} /> 
                  Ingredientes Actuales
                </h4>
                {skuRecetas.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-2">No hay materias primas asignadas a esta receta. Se venderá sin descontar insumos.</p>
                ) : (
                  <div className="space-y-2">
                    {skuRecetas.map(rec => (
                      <div key={rec.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{rec.stock_mp?.material}</span>
                          <span className="text-xs text-gray-400">Descuenta: <strong className="text-red-400">{rec.cantidad_necesaria} {rec.stock_mp?.unidad}</strong> por unidad vendida</span>
                        </div>
                        <button 
                          onClick={async () => {
                            if(confirm('¿Quitar este ingrediente de la receta?')) {
                              await removeRecetaItem(rec.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Quitar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <h4 className="font-medium text-sm text-gray-300 mb-3 uppercase tracking-wider">Añadir Ingrediente</h4>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Materia Prima</label>
                    <select 
                      value={newRecetaMpId}
                      onChange={e => setNewRecetaMpId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none text-white"
                    >
                      <option value="">Seleccionar material...</option>
                      {materiasPrimas.map(mp => (
                        <option key={mp.id} value={mp.id}>{mp.material} (Stock: {mp.cantidad} {mp.unidad})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs text-gray-400 mb-1">Cantidad req.</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      value={newRecetaCantidad}
                      onChange={e => setNewRecetaCantidad(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none text-white text-right" 
                    />
                  </div>
                  <button 
                    disabled={!newRecetaMpId || isSubmittingReceta}
                    onClick={async () => {
                      if (!newRecetaMpId) return;
                      setIsSubmittingReceta(true);
                      const res = await addRecetaItem(recetaModalSku.id, newRecetaMpId, newRecetaCantidad);
                      setIsSubmittingReceta(false);
                      if (!res.success) alert(res.error);
                      else {
                        setNewRecetaMpId('');
                        setNewRecetaCantidad(1);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors h-[38px] flex items-center justify-center"
                  >
                    {isSubmittingReceta ? '...' : 'Añadir'}
                  </button>
                </div>
                {newRecetaMpId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Se descontarán <strong className="text-red-400">{newRecetaCantidad} {materiasPrimas.find(m => m.id === newRecetaMpId)?.unidad}</strong> de {materiasPrimas.find(m => m.id === newRecetaMpId)?.material} por cada venta de este producto.
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/50">
               <button onClick={() => setRecetaModalSku(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              <th className="p-4 font-medium text-gray-400">Producto / Servicio</th>
              <th className="p-4 font-medium text-gray-400">Proveedor</th>
              <th className="p-4 font-medium text-gray-400 text-right">Costo</th>
              <th className="p-4 font-medium text-gray-400 text-right">Precio Venta</th>
              <th className="p-4 font-medium text-gray-400 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((sku) => (
              <tr key={sku.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-gray-300">
                  <div className="flex items-center gap-2">
                    <PackageOpen size={16} className={sku.es_servicio ? 'text-red-600' : 'text-red-600'} />
                    {sku.nombre}
                    {sku.es_servicio && <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full uppercase">Servicio</span>}
                  </div>
                </td>
                <td className="p-4 text-gray-400">{sku.proveedor || '-'}</td>
                <td className="p-4 text-right font-mono text-gray-400">${sku.costo?.toLocaleString() || 0}</td>
                <td className="p-4 text-right font-bold font-mono text-white">${sku.precio_recarga?.toLocaleString() || 0}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => setRecetaModalSku(sku)} 
                      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Configurar Receta (BOM)"
                    >
                      <FlaskConical size={16} />
                    </button>
                    <button onClick={() => setEditingSku(sku)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Editar Producto">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('¿Eliminar este producto del catálogo?')) {
                          const res = await deleteSku(sku.id);
                          if (res && !res.success) alert(res.error);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
