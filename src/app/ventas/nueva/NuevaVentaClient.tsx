'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { crearVenta } from './actions';

type Cliente = { id: string, nombre: string };
type Vendedor = { id: string, nombre: string };
type StockItem = {
  cantidad: number;
  skus: { id: string, nombre: string, precio_recarga: number };
};

export default function NuevaVentaClient({ clientes, stock, vendedores }: { clientes: Cliente[], stock: StockItem[], vendedores: Vendedor[] }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [cart, setCart] = useState<{sku_id: string, nombre: string, cantidad: number, precio: number, max: number, nro_serie: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Accounting fields
  const [nroFactura, setNroFactura] = useState('');
  const [estadoPago, setEstadoPago] = useState('Pagado');
  const [observaciones, setObservaciones] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [comprobante, setComprobante] = useState('');

  const addItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sku_id = e.target.value;
    if (!sku_id) return;
    
    const itemStock = stock.find(s => s.skus.id === sku_id);
    if (!itemStock) return;

    if (cart.find(c => c.sku_id === sku_id)) {
      e.target.value = '';
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

  const updateNroSerie = (sku_id: string, nro_serie: string) => {
    setCart(cart.map(item => item.sku_id === sku_id ? { ...item, nro_serie } : item));
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

    const result = await crearVenta(
      clienteId, 
      total, 
      items, 
      nroFactura, 
      estadoPago, 
      observaciones,
      estadoPago === 'Pagado' ? metodoPago : undefined,
      estadoPago === 'Pagado' ? comprobante : undefined,
      vendedorId || undefined
    );
    
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
        <div className="glass p-6 rounded-xl border-t-4 border-t-orange-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">1. Seleccionar Cliente *</label>
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
            <div>
              <label className="block text-sm font-bold mb-2">Vendedor (Comisiones)</label>
              <select 
                value={vendedorId}
                onChange={e => setVendedorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base focus:border-orange-500 outline-none"
              >
                <option value="">Ninguno / Local</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

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

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.sku_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex-1">
                  <h4 className="font-bold">{item.nombre}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-400">${item.precio} c/u</p>
                    <input 
                      type="text"
                      placeholder="N° Cilindro (Opcional)"
                      value={item.nro_serie}
                      onChange={(e) => updateNroSerie(item.sku_id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-orange-500 text-white w-40"
                    />
                  </div>
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

        {/* Datos Contables (Nuevos campos para Excel) */}
        <div className="glass p-6 rounded-xl">
          <label className="block text-sm font-bold mb-4">3. Datos de Facturación / Contables</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">N° Factura / Remito</label>
              <input 
                type="text" 
                value={nroFactura}
                onChange={e => setNroFactura(e.target.value)}
                placeholder="Ej. 0001-00001234"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Estado de Cobro</label>
              <select 
                value={estadoPago}
                onChange={e => setEstadoPago(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 outline-none"
              >
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Observaciones</label>
              <input 
                type="text" 
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Clasificación de Pagos (Solo si está pagado) */}
        {estadoPago === 'Pagado' && (
          <div className="glass p-6 rounded-xl border-t-4 border-t-green-500 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-bold mb-4 text-green-500">4. Detalles del Cobro</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Método de Pago</label>
                <select 
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="Cheque Diferido">Cheque Diferido</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Comprobante o Vuelto (Opcional)</label>
                <input 
                  type="text" 
                  value={comprobante}
                  onChange={e => setComprobante(e.target.value)}
                  placeholder="Ej: Nro Transferencia, Entregó $10000, etc..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

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
            {isSubmitting ? 'Procesando...' : <><CheckCircle2 size={20} /> Confirmar y Guardar</>}
          </button>
        </div>
      </div>

    </form>
  );
}
