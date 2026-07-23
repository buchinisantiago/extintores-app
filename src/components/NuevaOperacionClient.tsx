'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, CheckCircle2, ShoppingCart } from 'lucide-react';
import { getClientExtinguishers } from '../app/(dashboard)/ventas/nueva/actions';

type Cliente = { id: string, nombre: string };
type Vendedor = { id: string, nombre: string };
type StockItem = {
  cantidad: number;
  skus: { id: string, nombre: string, precio_recarga: number };
};
type Extintor = { id: string, nro_cilindro: string, skus: { nombre: string } };

import ProductSearchSelect from '@/components/ProductSearchSelect';

export default function NuevaOperacionClient({ 
  clientes, 
  stock, 
  vendedores, 
  currentUserVendedorId,
  crearPresupuestoAction,
  crearVentaAction,
  defaultMode = 'presupuesto'
}: { 
  clientes: Cliente[], 
  stock: StockItem[], 
  vendedores: Vendedor[], 
  currentUserVendedorId?: string,
  crearPresupuestoAction: any,
  crearVentaAction: any,
  defaultMode?: 'presupuesto' | 'venta'
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'presupuesto' | 'venta'>(defaultMode);
  const [clienteId, setClienteId] = useState('');
  const [clientExtintores, setClientExtintores] = useState<Extintor[]>([]);
  const [vendedorId, setVendedorId] = useState(currentUserVendedorId || '');
  const [cart, setCart] = useState<{sku_id: string, nombre: string, cantidad: number, precio: number, max: number, nro_serie: string, renovacion_carga_anios: number, renovacion_ph_anios: number, nro_serie_mode?: 'select' | 'otro'}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);

  // Accounting fields for Venta
  const [nroFactura, setNroFactura] = useState('');
  const [estadoPago, setEstadoPago] = useState('Pagado');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [comprobante, setComprobante] = useState('');

  useEffect(() => {
    if (clienteId) {
      getClientExtinguishers(clienteId).then(data => setClientExtintores((data as any) || []));
    } else {
      setClientExtintores([]);
    }
  }, [clienteId]);

  const addItem = (sku_id: string) => {
    if (!sku_id) return;
    const itemStock = stock.find(s => s.skus.id === sku_id);
    if (!itemStock) return;
    if (cart.find(c => c.sku_id === sku_id)) return;

    setCart([...cart, {
      sku_id,
      nombre: itemStock.skus.nombre,
      cantidad: 1,
      precio: itemStock.skus.precio_recarga,
      max: itemStock.cantidad,
      nro_serie: '',
      nro_serie_mode: 'select',
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

  const updateNroSerieMode = (sku_id: string, newMode: 'select' | 'otro') => {
    setCart(cart.map(item => item.sku_id === sku_id ? { ...item, nro_serie_mode: newMode } : item));
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

    if (mode === 'presupuesto') {
      const result = await crearPresupuestoAction(
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
    } else {
      const result = await crearVentaAction(
        clienteId,
        total,
        items,
        nroFactura,
        estadoPago,
        finalObservaciones,
        metodoPago,
        comprobante,
        vendedorId || undefined
      );
      if (result.success) {
        router.push(`/ventas/${result.venta_id}/success`);
      } else {
        alert("Error al crear la venta: " + result.error);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 space-y-6">

        {/* OPERATION MODE TOGGLE */}
        <div className="glass p-1 rounded-xl flex gap-1 bg-slate-900/50">
          <button 
            type="button"
            onClick={() => setMode('presupuesto')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'presupuesto' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <FileText size={18} />
            Crear Presupuesto
          </button>
          <button 
            type="button"
            onClick={() => setMode('venta')}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'venta' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <ShoppingCart size={18} />
            Venta Directa
          </button>
        </div>

        <div className={`glass p-6 rounded-xl border-t-4 ${mode === 'presupuesto' ? 'border-t-red-600' : 'border-t-green-600'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">1. Seleccionar Cliente *</label>
              <select 
                required 
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600`}
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
                  className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600`}
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
          <ProductSearchSelect stock={stock} onSelect={addItem} placeholder="+ Buscar producto..." />

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
                      className={`bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600 text-white w-24`}
                    />
                    <span className="text-sm text-gray-400">c/u</span>
                  </div>
                  <div className="mt-2 pl-1">
                    {item.nro_serie_mode === 'otro' ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text"
                          placeholder="Nuevo N° Serie / Identificador"
                          value={item.nro_serie}
                          onChange={(e) => updateNroSerie(item.sku_id, e.target.value)}
                          className={`bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600 text-white w-40`}
                          autoFocus
                        />
                        <button type="button" onClick={() => {
                          updateNroSerieMode(item.sku_id, 'select');
                          updateNroSerie(item.sku_id, '');
                        }} className="text-gray-500 hover:text-white px-1">✕</button>
                      </div>
                    ) : (
                      <select
                        value={item.nro_serie}
                        onChange={(e) => {
                          if (e.target.value === 'otro') {
                            updateNroSerieMode(item.sku_id, 'otro');
                            updateNroSerie(item.sku_id, '');
                          } else {
                            updateNroSerie(item.sku_id, e.target.value);
                          }
                        }}
                        className={`bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600 text-white w-56 appearance-none truncate`}
                      >
                        <option value="">Seleccionar Equipo (Opcional)...</option>
                        {clientExtintores.map(ext => (
                          <option key={ext.id} value={ext.nro_cilindro}>
                            {ext.skus?.nombre} - N° {ext.nro_cilindro}
                          </option>
                        ))}
                        <option value="otro">Otro / Nuevo equipo...</option>
                      </select>
                    )}
                  </div>
                  {item.nro_serie && item.nro_serie.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 pl-1 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Renueva Carga:</label>
                        <select
                          value={item.renovacion_carga_anios}
                          onChange={(e) => updateRenovacion(item.sku_id, 'carga', Number(e.target.value))}
                          className={`bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600 text-white appearance-none`}
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
                          className={`bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs outline-none focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600 text-white appearance-none`}
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
                  <div className="w-24 text-right font-bold text-gray-300">
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

        {/* VENTA FIELDS */}
        {mode === 'venta' && (
          <div className="glass p-6 rounded-xl animate-in fade-in slide-in-from-top-4 border-l-4 border-l-green-500">
            <label className="block text-sm font-bold mb-4 text-green-500">3. Datos Contables de la Venta</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">N° Factura / Remito</label>
                <input 
                  type="text" 
                  required={mode === 'venta'}
                  value={nroFactura}
                  onChange={e => setNroFactura(e.target.value)}
                  placeholder="Ej: F-0001-00001234"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Estado de Pago</label>
                <select 
                  value={estadoPago}
                  onChange={e => setEstadoPago(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none"
                >
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>
            </div>
            
            {estadoPago === 'Pagado' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
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
                  <label className="block text-xs font-medium text-gray-400 mb-1">Comprobante (Opcional)</label>
                  <input 
                    type="text" 
                    value={comprobante}
                    onChange={e => setComprobante(e.target.value)}
                    placeholder="Ej: Nro Transferencia"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="glass p-6 rounded-xl">
          <label className="block text-sm font-bold mb-4">{mode === 'venta' ? '4' : '3'}. Detalles Adicionales</label>
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1">Observaciones / Notas para el cliente</label>
            <textarea 
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Ej. Entrega en domicilio..."
              className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none min-h-[100px] focus:border-${mode === 'presupuesto' ? 'red' : 'green'}-600`}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="glass p-6 rounded-xl sticky top-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            {mode === 'presupuesto' ? <FileText className="text-red-600" /> : <ShoppingCart className="text-green-500" />} 
            Resumen de {mode === 'presupuesto' ? 'Presupuesto' : 'Venta'}
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {mode === 'presupuesto' && (
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
            )}
            {descuentoPorcentaje > 0 && mode === 'presupuesto' && (
              <div className="flex justify-between text-red-400 text-sm">
                <span>Ahorro</span>
                <span>-${(subtotal - total).toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-white/10 w-full my-4"></div>
            <div className="flex justify-between items-end">
              <span className="font-bold text-lg">Total</span>
              <span className={`font-black text-3xl ${mode === 'presupuesto' ? 'text-red-600' : 'text-green-500'}`}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || cart.length === 0 || !clienteId}
            className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 btn-animate transition-all disabled:opacity-50 ${
              mode === 'presupuesto' 
                ? 'bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600' 
                : 'bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600'
            }`}
          >
            {isSubmitting 
              ? 'Procesando...' 
              : <><CheckCircle2 size={20} /> {mode === 'presupuesto' ? 'Crear y Ver PDF' : 'Confirmar Venta'}</>}
          </button>
        </div>
      </div>

    </form>
  );
}
