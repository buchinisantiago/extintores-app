'use client';

import { useState } from 'react';
import { Users, Plus, Search, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { addCliente } from './actions';
import Link from 'next/link';

type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  extintores: [{ count: number }];
};

export default function ClientesClient({ initialData }: { initialData: Cliente[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  const filteredData = initialData.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.telefono && c.telefono.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Cabecera de controles */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 btn-animate"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Formulario Añadir */}
      {isAdding && (
        <form action={async (formData) => {
          await addCliente(formData);
          setIsAdding(false);
        }} className="glass p-6 rounded-xl border-l-4 border-l-blue-500 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-lg">Registrar Nuevo Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre Completo o Empresa *</label>
              <input name="nombre" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Teléfono</label>
              <input name="telefono" type="tel" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input name="email" type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dirección</label>
              <input name="direccion" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">Guardar Cliente</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.map((cliente) => (
          <div key={cliente.id} className="glass p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{cliente.nombre}</h3>
                  <div className="text-xs text-gray-400 mt-1 flex gap-2">
                    <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      {cliente.extintores[0]?.count || 0} extintores
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-300 mb-6">
                {cliente.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-500" /> {cliente.telefono}
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-500" /> {cliente.email}
                  </div>
                )}
                {cliente.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-500" /> {cliente.direccion}
                  </div>
                )}
              </div>
            </div>

            <Link 
              href={`/clientes/${cliente.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 font-medium hover:bg-blue-500/20 transition-colors"
            >
              Ver Detalle <ArrowRight size={16} />
            </Link>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full glass p-10 text-center rounded-xl text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>No se encontraron clientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
