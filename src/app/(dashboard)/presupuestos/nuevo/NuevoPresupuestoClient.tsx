'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { crearPresupuesto } from '../actions';

type Cliente = { id: string, nombre: string };
type Vendedor = { id: string, nombre: string };
type StockItem = {
  cantidad: number;
  skus: { id: string, nombre: string, precio_recarga: number };
};

import ProductSearchSelect from '@/components/ProductSearchSelect';

export default function NuevoPresupuestoClient({ clientes, stock, vendedores, currentUserVendedorId }: { clientes: Cliente[], stock: StockItem[], vendedores: Vendedor[], currentUserVendedorId?: string }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState('');
  const [vendedorId, setVendedorId] = useState(currentUserVendedorId || '');
  const [cart, setCart] = useState<{sku_id: string, nombre: string, cantidad: number, precio: number, max: number, nro_serie: string, renovacion_carga_anios: number, renovacion_ph_anios: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);

  const addItem = (sku_id: string) => {
    if (!sku_id) return;
    
    const itemStock = stock.find(s => s.skus.id === sku_id);
    if (!itemStock) return;

    if (cart.find(c => c.sku_id === sku_id)) {
      return;
    }

    setCart([...cart, {
      sku_id,
      nombre: itemStock.skus.nombre,
      cantidad: 1,
      precio: itemStock.skus.precio_recarga,
      max: itemStock.cantidad,
      nro_serie: '',
      renovacion_carga_anios: 1,
      renovacion_ph_anios: itemStock.skus.nombre.toLowerCase().includes('hidráulica') || itemStock.skus.nombre.toLowerCase().includes('ph') ? 5 : 0
    }]);
  };

  const updateQuantity = (sku_id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.sku_id === sku_id) {
        const newQ = item.cantidad + delta;
        if (newQ > 0 && newQ <= item.max) {
          return { ...item, cantidad: newQ };
        }
      }
      return item;
    }));
  };

  const updatePrecio = (sku_id: string, newPrecio: number) => {
    setCart(cart.map(item => item.sku_id === sku_id ? { ...item, precio: newPrecio } : item));
  };

  const updateNroSerie = (sku_id: string, nro_serie: string) => {
    setCart(cart.map(item => item.sku_id === sku_id ? { ...item, nro_serie } : item));
  };

  const updateRenovacion = (sku_id: string, type: 'carga' | 'ph', value: number) => {
    setCart(cart.map(item => item.sku_id === sku_id ? { 
      ...item, 
      [type === 'carga' ? 'renovacion_carga_anios' : 'renovacion_ph_anios']: value 
    } : item));
  };

  const removeItem = (sku_id: string) => {
    setCart(cart.filter(item => item.sku_id !== sku_id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
  const total = subtotal * (1 - descuentoPorcentaje / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || cart.length === 0) return;
    setIsSubmitting(true);
    
    const items = cart.map(c => ({
      sku_id: c.sku_id,
      cantidad: c.cantidad,
      precio_unitario: c.precio,
      nro_serie: c.nro_serie,
      renovacion_carga_anios: c.renovacion_carga_anios,
      renovacion_ph_anios: c.renovacion_ph_anios
    }));

    const finalObservaciones = descuentoPorcentaje > 0 
      ? `[Descuento Aplicado: ${descuentoPorcentaje}%]\n${observaciones}` 
      : observaciones;

    const result = await crearPresupuesto(
      clienteId, 
      total, 
      items, 
      finalObservaciones,
      vendedorId || undefined
    );
    
    if (result.success) {
      router.push(`/presupuestos/${result.id}/pdf`);
    } else {
      alert("Error al crear el presupuesto: " + result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-6 rounded-xl border-t-4 border-t-red-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">1. Seleccionar Cliente *</label>
              <select 
                required 
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base focus:border-red-600 outline-none"
              >
                <option value="">Buscar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Vendedor (Comisiones)</label>
              {currentUserVendedorId ? (
                <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-gray-400">
                  {vendedores.find(v => v.id === currentUserVendedorId)?.nombre || 'Vendedor Actual'}
                </div>
              ) : (
                <select 
                  value={vendedorId}
                  onChange={e => setVendedorId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base focus:border-red-600 outline-none"
                >
                  <option value="">Ninguno / Local</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <label className="block text-sm font-bold mb-2">2. Añadir Productos / Servicios</label>
          <ProductSearchSelect stock={stock} onSelect={addItem} placeholder="+ Buscar producto a cotizar..." />

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.sku_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex-1">
                  <h4 className="font-bold">{item.nombre}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-400">$</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={item.precio}
                      onChange={(e) => updatePrecio(item.sku_id, Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-red-600 text-white w-24"
                    />
                    <span className="text-sm text-gray-400">c/u</span>
                  </div>
                  <div className="mt-2 pl-1">
                    <input 
                      type="text"
                      placeholder="N° Cilindro (Opcional)"
                      value={item.nro_serie}
                      onChange={(e) => updateNroSerie(item.sku_id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-red-600 text-white w-40"
                    />
                  </div>
                  {item.nro_serie && item.nro_serie.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 pl-1 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Renueva Carga:</label>
                        <select
                          value={item.renovacion_carga_anios}
                          onChange={(e) => updateRenovacion(item.sku_id, 'carga', Number(e.target.value))}
                          className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs outline-none focus:border-red-600 text-white appearance-none"
                        >
                          <option value="0">No renueva</option>
                          <option value="1">1 Año</option>
                          <option value="2">2 Años</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Renueva PH:</label>
                        <select
                          value={item.renovacion_ph_anios}
                          onChange={(e) => updateRenovacion(item.sku_id, 'ph', Number(e.target.value))}
                          className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs outline-none focus:border-red-600 text-white appearance-none"
                        >
                          <option value="0">No renueva</option>
                          <option value="1">1 Año</option>
                          <option value="5">5 Años</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button type="button" onClick={() => updateQuantity(item.sku_id, -1)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700">-</button>
                    <span className="w-8 text-center font-bold">{item.cantidad}</span>
                    <button type="button" onClick={() => updateQuantity(item.sku_id, 1)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700">+</button>
                  </div>
                  <div className="w-24 text-right font-bold text-red-400">
                    ${item.cantidad * item.precio}
                  </div>
                  <button type="button" onClick={() => removeItem(item.sku_id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-8 text-gray-500 border border-dashed border-slate-700 rounded-xl">
                No has añadido ningún producto al presupuesto.
              </div>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <label className="block text-sm font-bold mb-4">3. Detalles Adicionales</label>
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Observaciones / Notas para el cliente</label>
            <textarea 
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Ej. Validez del presupuesto 15 días. Entrega en domicilio..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-red-600 outline-none min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="glass p-6 rounded-xl sticky top-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <FileText className="text-red-600" /> Resumen de Presupuesto
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Descuento (%)</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={descuentoPorcentaje} 
                  onChange={e => setDescuentoPorcentaje(Number(e.target.value))}
                  className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-red-600 text-white text-right"
                />
                <span>%</span>
              </div>
            </div>
            {descuentoPorcentaje > 0 && (
              <div className="flex justify-between text-red-400 text-sm">
                <span>Ahorro</span>
                <span>-${(subtotal - total).toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-white/10 w-full my-4"></div>
            <div className="flex justify-between items-end">
              <span className="font-bold text-lg">Total</span>
              <span className="font-black text-3xl text-red-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || cart.length === 0 || !clienteId}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 btn-animate transition-all"
          >
            {isSubmitting ? 'Generando...' : <><CheckCircle2 size={20} /> Crear y Ver PDF</>}
          </button>
        </div>
      </div>

    </form>
  );
}
