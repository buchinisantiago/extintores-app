'use client';

import { useState } from 'react';
import { PackageOpen, Plus, Trash2, Edit2, TrendingUp, X } from 'lucide-react';
import { addSku, updateSku, deleteSku, aumentoMasivo } from './actions';

type SKU = {
  id: string;
  nombre: string;
  precio_recarga: number;
  es_servicio: boolean;
  proveedor: string | null;
  costo: number;
};

export default function CatalogoClient({ initialData }: { initialData: SKU[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSku, setEditingSku] = useState<SKU | null>(null);
  const [isAumentoModal, setIsAumentoModal] = useState(false);

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
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 btn-animate"
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
        }} className="glass p-6 rounded-xl border-l-4 border-l-orange-500 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-lg">Registrar Nuevo Producto/Servicio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
              <input name="nombre" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Precio Venta ($) *</label>
              <input name="precio_recarga" type="number" step="0.01" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Costo Unitario ($)</label>
              <input name="costo" type="number" step="0.01" defaultValue="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Proveedor</label>
              <input name="proveedor" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 focus:border-orange-500 outline-none" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" name="es_servicio" id="es_servicio" className="w-4 h-4 accent-orange-500" />
              <label htmlFor="es_servicio" className="text-sm">Es un Servicio (no lleva stock)</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-medium transition-colors">Guardar</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {isAumentoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
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
                <input name="nombre" defaultValue={editingSku.nombre} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Proveedor</label>
                <input name="proveedor" defaultValue={editingSku.proveedor || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Costo ($)</label>
                  <input name="costo" type="number" step="0.01" defaultValue={editingSku.costo} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Precio Venta ($)</label>
                  <input name="precio_recarga" type="number" step="0.01" defaultValue={editingSku.precio_recarga} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none text-white" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingSku(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors">Guardar Cambios</button>
              </div>
            </form>
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
                    <PackageOpen size={16} className={sku.es_servicio ? 'text-blue-500' : 'text-orange-500'} />
                    {sku.nombre}
                    {sku.es_servicio && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase">Servicio</span>}
                  </div>
                </td>
                <td className="p-4 text-gray-400">{sku.proveedor || '-'}</td>
                <td className="p-4 text-right font-mono text-gray-400">${sku.costo?.toLocaleString() || 0}</td>
                <td className="p-4 text-right font-bold font-mono text-white">${sku.precio_recarga?.toLocaleString() || 0}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setEditingSku(sku)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
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
