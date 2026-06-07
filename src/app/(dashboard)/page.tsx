import { supabase } from '@/lib/supabase';
import { Flame, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Disable caching for realtime dashboard

export default async function Dashboard() {
  // Fetch stats concurrently
  const [
    { count: extintoresVencidos },
    { count: extintoresPorVencer },
    { data: stockMateriaPrima },
    { data: stockTerminado }
  ] = await Promise.all([
    supabase.from('extintores_view').select('*', { count: 'exact', head: true }).eq('estado', 'vencido'),
    supabase.from('extintores_view').select('*', { count: 'exact', head: true }).eq('estado', 'por_vencer'),
    supabase.from('stock_mp').select('*'),
    supabase.from('stock_terminado').select('*, skus(nombre)')
  ]);

  const mpEnAlerta = stockMateriaPrima?.filter(mp => mp.cantidad <= (mp.alerta_minimo || 0)) || [];
  const stockTerminadoTotal = stockTerminado?.reduce((acc, curr) => acc + curr.cantidad, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-gray-400">Resumen operativo del local y alertas del sistema.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-6 border-l-4 border-l-red-600 hover:bg-white/5 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Por Vencer (30d)</p>
              <h3 className="text-3xl font-bold text-red-400">{extintoresPorVencer || 0}</h3>
            </div>
            <div className="p-3 bg-red-600/10 rounded-lg text-red-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border-l-4 border-l-red-500 hover:bg-white/5 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Extintores Vencidos</p>
              <h3 className="text-3xl font-bold text-red-500">{extintoresVencidos || 0}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
              <Flame size={24} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border-l-4 border-l-red-600 hover:bg-white/5 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Alertas Stock M.P.</p>
              <h3 className="text-3xl font-bold text-red-400">{mpEnAlerta.length}</h3>
            </div>
            <div className="p-3 bg-red-600/10 rounded-lg text-red-600">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border-l-4 border-l-emerald-500 hover:bg-white/5 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Stock Terminado</p>
              <h3 className="text-3xl font-bold text-emerald-400">{stockTerminadoTotal}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de Materia Prima */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package size={20} className="text-red-600" />
            Materia Prima Crítica
          </h2>
          {mpEnAlerta.length > 0 ? (
            <div className="space-y-3">
              {mpEnAlerta.map(mp => (
                <div key={mp.id} className="flex justify-between items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="font-medium">{mp.material}</span>
                  <div className="text-right">
                    <span className="text-red-400 font-bold">{mp.cantidad} {mp.unidad}</span>
                    <span className="text-gray-400 text-xs block">Mínimo: {mp.alerta_minimo}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No hay alertas de stock en materia prima.</p>
          )}
          <Link href="/stock/mp" className="mt-4 inline-block text-sm text-red-400 hover:text-blue-300">
            Gestionar inventario &rarr;
          </Link>
        </div>

        {/* Acciones Rápidas */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/ventas/nueva" className="p-4 rounded-xl bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 transition-all text-center btn-animate">
              <span className="block text-red-400 font-bold mb-1">Nueva Venta</span>
              <span className="text-xs text-gray-400">Registrar salida de stock</span>
            </Link>
            <Link href="/clientes" className="p-4 rounded-xl bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 transition-all text-center btn-animate">
              <span className="block text-red-400 font-bold mb-1">Nuevo Cliente</span>
              <span className="text-xs text-gray-400">Y registrar extintores</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
