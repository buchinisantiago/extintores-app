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
  const [cart, setCart] = useState<{sku_id: string, nombre: string, cantidad: number, precio: number, max: number, nro_serie: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observaciones, setObservaciones] = useState('');

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
      nro_serie: ''
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

  const removeItem = (sku_id: string) => {
    setCart(cart.filter(item => item.sku_id !== sku_id));
  };

  const total = cart.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || cart.length === 0) return;
    setIsSubmitting(true);
    
    const items = cart.map(c => ({
      sku_id: c.sku_id,
      cantidad: c.cantidad,
      precio_unitario: c.precio,
      nro_serie: c.nro_serie
    }));

    const result = await crearPresupuesto(
      clienteId, 
      total, 
      items, 
      observaciones,
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
                </div>
                
                <div className="flex items-center gap-4">
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
              <span>${total}</span>
            </div>
            <div className="h-px bg-white/10 w-full my-4"></div>
            <div className="flex justify-between items-end">
              <span className="font-bold text-lg">Total</span>
              <span className="font-black text-3xl text-red-600">${total}</span>
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
