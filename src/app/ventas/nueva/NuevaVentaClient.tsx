'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { crearVenta } from './actions';

type Cliente = { id: string, nombre: string };
type StockItem = {
  cantidad: number;
  skus: { id: string, nombre: string, precio_recarga: number };
};

export default function NuevaVentaClient({ clientes, stock }: { clientes: Cliente[], stock: StockItem[] }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState('');
  const [cart, setCart] = useState<{sku_id: string, nombre: string, cantidad: number, precio: number, max: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sku_id = e.target.value;
    if (!sku_id) return;
    
    const itemStock = stock.find(s => s.skus.id === sku_id);
    if (!itemStock) return;

    // Check if already in cart
    if (cart.find(c => c.sku_id === sku_id)) {
      e.target.value = '';
      return;
    }

    setCart([...cart, {
      sku_id,
      nombre: itemStock.skus.nombre,
      cantidad: 1,
      precio: itemStock.skus.precio_recarga,
      max: itemStock.cantidad
    }]);
    
    e.target.value = '';
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
      precio_unitario: c.precio
    }));

    const result = await crearVenta(clienteId, total, items);
    
    if (result.success) {
      router.push('/ventas');
    } else {
      alert("Error al crear la venta: " + result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 space-y-6">
        {/* Selector de Cliente */}
        <div className="glass p-6 rounded-xl border-t-4 border-t-orange-500">
          <label className="block text-sm font-bold mb-2">1. Seleccionar Cliente</label>
          <select 
            required 
            value={clienteId}
            onChange={e => setClienteId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base focus:border-orange-500 outline-none"
          >
            <option value="">Buscar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {/* Añadir Productos */}
        <div className="glass p-6 rounded-xl">
          <label className="block text-sm font-bold mb-2">2. Añadir Productos al Remito</label>
          <select 
            onChange={addItem}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base focus:border-orange-500 outline-none mb-6"
          >
            <option value="">+ Seleccionar extintor recargado...</option>
            {stock.map(s => (
              <option key={s.skus.id} value={s.skus.id}>
                {s.skus.nombre} (Disponibles: {s.cantidad}) - ${s.skus.precio_recarga}
              </option>
            ))}
          </select>

          {/* Carrito */}
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.sku_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex-1">
                  <h4 className="font-bold">{item.nombre}</h4>
                  <p className="text-sm text-gray-400">${item.precio} c/u</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button type="button" onClick={() => updateQuantity(item.sku_id, -1)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700">-</button>
                    <span className="w-8 text-center font-bold">{item.cantidad}</span>
                    <button type="button" onClick={() => updateQuantity(item.sku_id, 1)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700">+</button>
                  </div>
                  <div className="w-24 text-right font-bold text-orange-400">
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
                No has añadido ningún producto.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="lg:col-span-1">
        <div className="glass p-6 rounded-xl sticky top-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <ShoppingCart className="text-orange-500" /> Resumen de Venta
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Descuento</span>
              <span>$0</span>
            </div>
            <div className="h-px bg-white/10 w-full my-4"></div>
            <div className="flex justify-between items-end">
              <span className="font-bold text-lg">Total</span>
              <span className="font-black text-3xl text-orange-500">${total}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || cart.length === 0 || !clienteId}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 btn-animate transition-all"
          >
            {isSubmitting ? 'Procesando...' : <><CheckCircle2 size={20} /> Confirmar y Descontar Stock</>}
          </button>
        </div>
      </div>

    </form>
  );
}
