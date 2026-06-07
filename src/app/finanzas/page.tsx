import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, Package } from 'lucide-react';

export const revalidate = 0;

export default async function FinanzasPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  if (role !== 'Gerente') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <TrendingDown size={40} />
        </div>
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-gray-400 max-w-md">El módulo de Finanzas es exclusivo para la Gerencia. Utiliza el Simulador de Rol en el menú izquierdo para cambiar a "Gerente" y poder ver esta página.</p>
      </div>
    );
  }

  // Fetch Ventas and Gastos
  const { data: ventas } = await supabase.from('ventas').select('total, estado_pago, vendedor_id, vendedores(nombre), venta_items(cantidad, costo_unitario)');
  const { data: gastos } = await supabase.from('gastos').select('monto, estado_pago');
  const { data: stock_terminado } = await supabase.from('stock_terminado').select('cantidad, skus(costo)');

  const ingresosTotales = (ventas || []).reduce((acc, v) => acc + (v.total || 0), 0);
  const ingresosPagados = (ventas || []).filter(v => v.estado_pago === 'Pagado').reduce((acc, v) => acc + (v.total || 0), 0);
  
  const egresosTotales = (gastos || []).reduce((acc, g) => acc + (g.monto || 0), 0);
  
  // Costo de Mercadería Vendida (COGS) solo de lo cobrado o de todo?
  // Generalmente la ganancia se calcula sobre lo que ya se cobró.
  const costoMercaderiaVendida = (ventas || []).filter(v => v.estado_pago === 'Pagado').reduce((acc, v) => {
    const costoVenta = (v.venta_items as any[] || []).reduce((sum, item) => sum + (item.cantidad * (item.costo_unitario || 0)), 0);
    return acc + costoVenta;
  }, 0);

  const gananciaBruta = ingresosPagados - egresosTotales - costoMercaderiaVendida;

  const capitalEnStock = (stock_terminado || []).reduce((acc, st: any) => acc + (st.cantidad * (st.skus?.costo || 0)), 0);

  // Calcular ventas cobradas por vendedor
  const ventasPorVendedor = (ventas || []).reduce((acc: any, v) => {
    if (v.vendedor_id && v.estado_pago === 'Pagado') {
      const vend = v.vendedores as any;
      const nombre = vend?.nombre || 'Desconocido';
      if (!acc[nombre]) acc[nombre] = 0;
      acc[nombre] += v.total || 0;
    }
    return acc;
  }, {}) as Record<string, number>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Panel de Finanzas</h1>
        <p className="text-gray-400">Resumen contable exclusivo para Gerencia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta de Ingresos */}
        <div className="glass p-6 rounded-2xl border-l-4 border-l-green-500 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-green-500" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Ingresos Efectivos (Pagados)</p>
          <h2 className="text-4xl font-black text-white">${ingresosPagados.toLocaleString()}</h2>
          <p className="text-sm text-gray-500 mt-2">Facturado total: ${ingresosTotales.toLocaleString()}</p>
        </div>

        {/* Tarjeta de Egresos */}
        <div className="glass p-6 rounded-2xl border-l-4 border-l-red-500 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} className="text-red-500" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Egresos Totales</p>
          <h2 className="text-4xl font-black text-white">${egresosTotales.toLocaleString()}</h2>
          <p className="text-sm text-gray-500 mt-2">Gastos, compras e insumos</p>
        </div>

        {/* Tarjeta de Capital */}
        <div className="glass p-6 rounded-2xl border-l-4 border-l-blue-500 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={64} className="text-blue-500" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Capital en Repuestos / Stock</p>
          <h2 className="text-4xl font-black text-white">${capitalEnStock.toLocaleString()}</h2>
          <p className="text-sm text-gray-500 mt-2">Valor de costo del stock actual</p>
        </div>

        {/* Tarjeta de Ganancia */}
        <div className="glass p-6 rounded-2xl border-l-4 border-l-orange-500 relative overflow-hidden group md:col-span-3 lg:col-span-1">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-orange-500" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Ganancia Real Estimada</p>
          <h2 className={`text-4xl font-black ${gananciaBruta >= 0 ? 'text-white' : 'text-red-400'}`}>
            ${gananciaBruta.toLocaleString()}
          </h2>
          <p className="text-sm text-gray-500 mt-2">Ingresos cobrados - Gastos - Costos Prod.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-blue-500" />
            <h3 className="text-xl font-bold">Ventas por Empleado (Para Comisiones)</h3>
          </div>
          
          <div className="space-y-4">
            {Object.keys(ventasPorVendedor).length === 0 ? (
              <p className="text-gray-500 italic">No hay ventas registradas a vendedores aún.</p>
            ) : (
              Object.entries(ventasPorVendedor).sort((a, b) => b[1] - a[1]).map(([nombre, total]) => (
                <div key={nombre} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                  <span className="font-bold">{nombre}</span>
                  <span className="text-blue-400 font-black">${total.toLocaleString()}</span>
                </div>
              ))
            )}
            <p className="text-xs text-gray-500 mt-4">* Solo se contabilizan ventas ya "Pagadas".</p>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-orange-500" />
            <h3 className="text-xl font-bold">Estado de Cuenta</h3>
          </div>
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-gray-500 text-center px-4">
            El gráfico de evolución histórica se habilitará en próximas fases cuando haya más datos históricos.
          </div>
        </div>
      </div>
    </div>
  );
}
