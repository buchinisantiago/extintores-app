'use client';

import { useState } from 'react';
import { Flame, Plus, Trash2, MapPin, Phone, Mail, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addExtintor, deleteExtintor } from './actions';
import { format } from 'date-fns';
import { DollarSign, Edit2, X } from 'lucide-react';
import MarcarPagadoButton from '../../ventas/MarcarPagadoButton';
import VentaRowActions from '../../ventas/VentaRowActions';
import { updateCliente, deleteCliente } from '../actions';
import { useRouter } from 'next/navigation';

type Cliente = {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
};

type SKU = {
  id: string;
  nombre: string;
  tipo_agente: string;
};

type Extintor = {
  id: string;
  cliente_id: string;
  nro_serie: string;
  fecha_carga: string;
  fecha_vence: string;
  estado: 'vigente' | 'por_vencer' | 'vencido';
  fecha_ph: string | null;
  vence_ph: string | null;
  estado_ph: 'vigente' | 'por_vencer' | 'vencido' | 'sin_datos';
  skus: { nombre: string, tipo_agente: string };
};

type Venta = {
  id: string;
  fecha: string;
  nro_factura: string | null;
  estado_pago: 'Pagado' | 'Pendiente';
  total: number;
};


export default function ClienteDetalleClient({ 
  cliente, 
  initialExtintores, 
  skus,
  ventas
}: { 
  cliente: Cliente, 
  initialExtintores: Extintor[],
  skus: SKU[],
  ventas: Venta[]
}) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const saldoDeudor = ventas.filter(v => v.estado_pago === 'Pendiente').reduce((acc, v) => acc + v.total, 0);

  const handleDeleteClient = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
      const result = await deleteCliente(cliente.id);
      if (result.success) {
        router.push('/clientes');
      } else {
        alert(result.error);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna Izquierda: Datos del Cliente */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass p-6 rounded-xl border-t-4 border-t-red-600 relative group">
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Editar Cliente">
              <Edit2 size={18} />
            </button>
            <button onClick={handleDeleteClient} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar Cliente">
              <Trash2 size={18} />
            </button>
          </div>
          <h2 className="text-xl font-bold mb-4">Información de Contacto</h2>
          <div className="space-y-4 text-gray-300">
            {cliente.documento && (
              <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                <span className="font-bold text-red-600 text-[10px] uppercase bg-white/5 px-2 py-1 rounded">Doc</span>
                <span>{cliente.documento}</span>
              </div>
            )}
            {cliente.telefono && (
              <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                <Phone className="text-red-600" size={18} />
                <span>{cliente.telefono}</span>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                <Mail className="text-red-600" size={18} />
                <span className="break-all">{cliente.email}</span>
              </div>
            )}
            {cliente.direccion && (
              <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                <MapPin className="text-red-600 shrink-0 mt-0.5" size={18} />
                <span>
                  {cliente.direccion}
                  {cliente.ciudad ? `, ${cliente.ciudad}` : ''}
                  {cliente.provincia ? ` - ${cliente.provincia}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Total Extintores</span>
            <span className="text-3xl font-black text-white">{initialExtintores.length}</span>
          </div>
        </div>

        <div className={`glass p-6 rounded-xl border-t-4 ${saldoDeudor > 0 ? 'border-t-red-500' : 'border-t-emerald-500'}`}>
          <h2 className="text-xl font-bold mb-1">Estado de Cuenta</h2>
          <p className="text-gray-400 text-sm mb-4">Saldo pendiente de pago</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Deuda Total</span>
            <span className={`text-3xl font-black ${saldoDeudor > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              ${saldoDeudor.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Parque de Extintores */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="text-red-600" />
            Parque de Extintores
          </h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 btn-animate"
          >
            <Plus size={18} />
            Asignar Extintor
          </button>
        </div>

        {isAdding && (
          <form action={async (formData) => {
            await addExtintor(formData);
            setIsAdding(false);
          }} className="glass p-6 rounded-xl border border-red-600/30 animate-in slide-in-from-top-4">
            <input type="hidden" name="cliente_id" value={cliente.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Tipo de Extintor (SKU) *</label>
                <select name="sku_id" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none">
                  <option value="">Selecciona un extintor...</option>
                  {skus.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Número de Serie</label>
                <input name="nro_serie" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fecha de Carga *</label>
                <input name="fecha_carga" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Fecha Prueba Hidráulica (opcional)</label>
                <input name="fecha_ph" type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-red-600 outline-none" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium">Asignar</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium">Cancelar</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {initialExtintores.map(ext => (
            <div key={ext.id} className="glass p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:bg-white/5 transition-all group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-white">{ext.skus?.nombre}</h3>
                  {ext.nro_serie && (
                    <span className="bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-widest">
                      N° {ext.nro_serie}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400">
                  <span>Últ. Carga: <span className="text-gray-300">{format(new Date(ext.fecha_carga), 'dd/MM/yyyy')}</span> <span className="text-gray-500 ml-1">(Vence: {format(new Date(ext.fecha_vence), 'dd/MM/yyyy')})</span></span>
                  {ext.fecha_ph && <span>Últ. P.H.: <span className="text-gray-300">{format(new Date(ext.fecha_ph), 'dd/MM/yyyy')}</span> <span className="text-gray-500 ml-1">(Vence: {ext.vence_ph ? format(new Date(ext.vence_ph), 'dd/MM/yyyy') : 'N/A'})</span></span>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                {/* Badge PH */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium">
                  <span className="text-gray-500">PH:</span>
                  {ext.estado_ph === 'sin_datos' && <span className="text-gray-500">N/A</span>}
                  {ext.estado_ph === 'vigente' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Vigente</span>}
                  {ext.estado_ph === 'por_vencer' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12}/> Vence pronto</span>}
                  {ext.estado_ph === 'vencido' && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Vencida</span>}
                </div>

                {/* Badge Carga */}
                {ext.estado === 'vigente' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <CheckCircle2 size={14}/> Vigente
                  </span>
                )}
                {ext.estado === 'por_vencer' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 text-red-400 text-xs font-bold border border-red-600/20">
                    <AlertTriangle size={14}/> Por Vencer
                  </span>
                )}
                {ext.estado === 'vencido' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                    <Flame size={14}/> Vencido
                  </span>
                )}

                <button 
                  onClick={async () => {
                    if (confirm('¿Eliminar extintor de este cliente?')) {
                      await deleteExtintor(ext.id, cliente.id);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2 md:opacity-0 md:group-hover:opacity-100"
                  title="Eliminar Extintor"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {initialExtintores.length === 0 && (
            <div className="text-center py-10 text-gray-500 border border-dashed border-slate-700 rounded-xl">
              Este cliente aún no tiene extintores asignados.
            </div>
          )}
        </div>

        {/* Cuenta Corriente y Ventas */}
        <div className="pt-8 mt-8 border-t border-white/10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <DollarSign className="text-green-500" />
            Cuenta Corriente y Ventas
          </h2>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-sm">
                    <th className="p-4 font-medium text-gray-400">Fecha</th>
                    <th className="p-4 font-medium text-gray-400">N° Factura</th>
                    <th className="p-4 font-medium text-gray-400">Estado</th>
                    <th className="p-4 font-medium text-gray-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">No hay ventas registradas.</td>
                  </tr>
                )}
                {ventas.map(venta => (
                  <tr key={venta.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-300">
                      {format(new Date(venta.fecha), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-gray-400">
                      {venta.nro_factura || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venta.estado_pago === 'Pagado' ? 'bg-green-500/20 text-green-400' : 
                          venta.estado_pago === 'Pendiente' ? 'bg-red-500/20 text-red-400' : 
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {venta.estado_pago || 'Pagado'}
                        </span>
                        {venta.estado_pago === 'Pendiente' && (
                          <MarcarPagadoButton ventaId={venta.id} />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-red-400">
                      <div className="flex items-center justify-end gap-4 group">
                        <span>${venta.total?.toLocaleString() || 0}</span>
                        <VentaRowActions venta={venta as any} />
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="font-bold text-lg text-white">Editar Cliente</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form action={async (formData) => {
              const res = await updateCliente(cliente.id, formData);
              if (res.success) {
                setIsEditing(false);
              } else {
                alert(res.error);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                <input name="nombre" defaultValue={cliente.nombre} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">DNI / CUIT / CUIL</label>
                <input name="documento" defaultValue={cliente.documento || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                <input name="telefono" type="tel" pattern="[0-9+\-\s]+" title="Solo se permiten números, espacios, signos + y guiones -" defaultValue={cliente.telefono || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input name="email" type="email" defaultValue={cliente.email || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Dirección</label>
                <input name="direccion" defaultValue={cliente.direccion || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Ciudad</label>
                <input name="ciudad" defaultValue={cliente.ciudad || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Provincia</label>
                <select name="provincia" defaultValue={cliente.provincia || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:border-red-600 outline-none text-white appearance-none">
                  <option value="">Seleccionar...</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="CABA">CABA</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="Chaco">Chaco</option>
                  <option value="Chubut">Chubut</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Entre Ríos">Entre Ríos</option>
                  <option value="Formosa">Formosa</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="La Pampa">La Pampa</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Neuquén">Neuquén</option>
                  <option value="Río Negro">Río Negro</option>
                  <option value="Salta">Salta</option>
                  <option value="San Juan">San Juan</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Santiago del Estero">Santiago del Estero</option>
                  <option value="Tierra del Fuego">Tierra del Fuego</option>
                  <option value="Tucumán">Tucumán</option>
                  <option value="Otro">Otro (Exterior)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 rounded-lg transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
